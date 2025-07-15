import type { Request, Response } from "express";
import { connection } from "../config/db";
import { separatedProductInterface } from "../interface/valueInterface";

export class SeparatedProductController {
    // * Get all separated product
    static getAllSeparatedProduct = async (req: Request, res: Response) => {
        try {
            const result = await connection.query(
                "select BIN_TO_UUID(pa.id) as id, LPAD(pa.numero_apartado, 10, '0') AS numero_apartado, pa.termino, pa.observaciones, pa.subtotal, pa.total, pa.estado, pa.prefacturacion, pa.facturacion, pa.impuesto_manual, BIN_TO_UUID(cl.id) as id_cliente, cl.nombre_cliente as cliente, pa.fecha_creacion, coalesce(uc.nombre_usuario, '') as nombre_usuario_creador, coalesce(um.nombre_usuario, '') as nombre_usuario_modificador from producto_apartado pa inner join cliente cl on cl.id=pa.id_cliente left join usuario uc on uc.id=pa.usuario_creador left join usuario um on um.id=pa.usuario_modificador order by pa.numero_apartado desc;"
            );
            res.json(result[0]);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    // * Get details separated product by id
    static getDetailsSeparatedProductById = async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            const result = await connection.query(
                "select BIN_TO_UUID(dpa.id_producto) as id_producto, BIN_TO_UUID(dpa.id_inventario) as id_inventario, p.nombre_producto, p.utilidad1, p.utilidad2, p.utilidad3, p.utilidad4, p.precio1, p.precio2, p.precio3, p.precio4, dpa.cantidad, dpa.precio_venta, dpa.subtotal from detalle_producto_apartado dpa inner join producto p on p.id=dpa.id_producto inner join inventario i on i.id=dpa.id_inventario where BIN_TO_UUID(dpa.id_producto_apartado) = ?;",
                [id]
            );
            res.json(result[0]);
        } catch (error: any) {
            res.status(500).json({ error: error.message })
        }
    }

    // *  Create new seprated product
    static createSeparatedProduct = async (req: Request, res: Response) => {
        const separatedProduct = <separatedProductInterface>req.body;

        const {
            termino,
            observaciones,
            subtotal,
            total,
            estado,
            detalle_producto_apartado,
            impuesto_manual,
            id_cliente,
            usuario_creador,
        } = separatedProduct;

        try {
            const userExists = await connection.query(
                "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
                [usuario_creador]
            );
            const [{ idUser }] = (userExists as any)[0];
            if (idUser === 0) {
                const error = new Error("El usuario que esta intentando crear esta cotización no existe en la base de datos...");
                return res.status(409).json({ error: error.message });
            }

            const uuId = await connection.query("select UUID() as getIdSeparatedProduct;")
            const [{ getIdSeparatedProduct }] = (uuId as any)[0];

            await connection.query(
                "insert into producto_apartado (id, termino, observaciones, subtotal, total, estado, prefacturacion, facturacion, impuesto_manual, id_cliente, usuario_creador, fecha_creacion) values(UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?), now())",
                [
                    getIdSeparatedProduct,
                    termino,
                    observaciones,
                    subtotal,
                    total,
                    estado,
                    0,
                    0,
                    JSON.stringify(impuesto_manual),
                    id_cliente,
                    usuario_creador,
                ]
            );

            for (const detallesProductoApartado of detalle_producto_apartado) {

                const getDataInventory = await connection.query(
                    "select stock, coalesce(cantidad_apartado, '0') as cantidad_apartado from inventario where BIN_TO_UUID(id_producto) = ?;",
                    [
                        detallesProductoApartado.id_producto
                    ]
                );
                const [{ stock, cantidad_apartado }] = (getDataInventory as any)[0];

                const newStockInvetor = stock - detallesProductoApartado.cantidad;

                if (newStockInvetor < 0) {
                    return res.status(409).json({ error: "No hay suficiente stock para crear el apartado del producto..." });
                }
                else {
                    if (cantidad_apartado > 0) {
                        const resultNewAmmountDetailsSeparated = parseInt(cantidad_apartado) + detallesProductoApartado.cantidad;

                        await connection.query(
                            "update inventario set cantidad_apartado = ?, stock = ? where BIN_TO_UUID(id_producto) = ?;",
                            [
                                resultNewAmmountDetailsSeparated,
                                newStockInvetor,
                                detallesProductoApartado.id_producto
                            ]
                        );

                        await connection.query(
                            "insert into detalle_producto_apartado (id_producto, id_inventario, precio_venta, cantidad, subtotal, id_producto_apartado) values (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?, UUID_TO_BIN(?));",
                            [
                                detallesProductoApartado.id_producto,
                                detallesProductoApartado.id_inventario,
                                detallesProductoApartado.precio_venta,
                                detallesProductoApartado.cantidad,
                                detallesProductoApartado.subtotal,
                                getIdSeparatedProduct
                            ]
                        );
                    }
                    else {

                        await connection.query(
                            "update inventario set cantidad_apartado = ?, stock = ? where BIN_TO_UUID(id_producto) = ?;",
                            [
                                detallesProductoApartado.cantidad,
                                newStockInvetor,
                                detallesProductoApartado.id_producto
                            ]
                        );

                        await connection.query(
                            "insert into detalle_producto_apartado (id_producto, id_inventario, precio_venta, cantidad, subtotal, id_producto_apartado) values (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?, UUID_TO_BIN(?));",
                            [
                                detallesProductoApartado.id_producto,
                                detallesProductoApartado.id_inventario,
                                detallesProductoApartado.precio_venta,
                                detallesProductoApartado.cantidad,
                                detallesProductoApartado.subtotal,
                                getIdSeparatedProduct
                            ]
                        );
                    }
                }
            }
            res.send("El apartado del producto se creo correctamente...");
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    // * Update separated product by id
    static updateSeparatedProduct = async (req: Request, res: Response) => {
        const { id } = req.params;
        const separatedProduct = <separatedProductInterface>req.body;

        const {
            termino,
            observaciones,
            subtotal,
            total,
            estado,
            impuesto_manual,
            detalle_producto_apartado,
            id_cliente,
            usuario_modificador,
        } = separatedProduct;


        try {
            const userExists = await connection.query(
                "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
                [usuario_modificador]
            );
            const [{ idUser }] = (userExists as any)[0];
            if (idUser === 0) {
                const error = new Error("El usuario que esta intentando modificar este apartado de product no existe en la base de datos...");
                return res.status(409).json({ error: error.message });
            }

            const salesSeparatedProductExists = await connection.query(
                "select count(BIN_TO_UUID(id)) as numberSeparatedProduct from producto_apartado where id = UUID_TO_BIN(?);",
                [id]
            );
            const [{ numberSeparatedProduct }] = (salesSeparatedProductExists as any)[0];

            if (numberSeparatedProduct === 0) {
                const error = new Error(
                    "Este apartado no existe en la base de datos..."
                );
                return res.status(404).json({ error: error.message });
            }

            await connection.query(
                "update producto_apartado set termino = ?, observaciones = ?, subtotal = ?, total = ?, estado = ?, prefacturacion = ?, facturacion = ?, fecha_modificacion = now(), impuesto_manual = ?, id_cliente = UUID_TO_BIN(?), usuario_modificador = UUID_TO_BIN(?) where id = UUID_TO_BIN(?);",
                [
                    termino,
                    observaciones,
                    subtotal,
                    total,
                    estado,
                    0,
                    0,
                    JSON.stringify(impuesto_manual),
                    id_cliente,
                    usuario_modificador,
                    id
                ]
            );

            for (const detallesSeparatedProduct of detalle_producto_apartado) {

                const getStockAndExists = await connection.query(
                    "select cantidad_apartado as existsProduct from inventario where id_producto = UUID_TO_BIN(?);",
                    [detallesSeparatedProduct.id_producto]
                );
                const [{ existsProduct }] = (getStockAndExists as any)[0];


                if (existsProduct > 0) {

                    const getStockInventoryByIdProduct = await connection.query(
                        "select stock from inventario where id_producto = UUID_TO_BIN(?);",
                        [detallesSeparatedProduct.id_producto]
                    );
                    const [{ stock }] = (getStockInventoryByIdProduct as any)[0];

                    const getAmmountSeparatedProduct = await connection.query(
                        "select cantidad from detalle_producto_apartado where id_producto = UUID_TO_BIN(?);",
                        [detallesSeparatedProduct.id_producto]
                    );
                    const [{ cantidad }] = (getAmmountSeparatedProduct as any)[0];

                    const sumStockInventory = stock + cantidad;

                    await connection.query(
                        "update inventario set stock = ? where id_producto = UUID_TO_BIN(?);",
                        [
                            sumStockInventory,
                            detallesSeparatedProduct.id_producto
                        ]
                    );

                    const getNewStockInventory = await connection.query(
                        "select stock as newStock from inventario where id_producto = UUID_TO_BIN(?);",
                        [detallesSeparatedProduct.id_producto]
                    );

                    const [{ newStock }] = (getNewStockInventory as any)[0];
                    const newInventoryStock = newStock - detallesSeparatedProduct.cantidad;

                    if (newInventoryStock <= 0) {
                        return res.status(409).json({ error: "No hay suficiente stock en el inventario para crear la separación del producto..." });
                    }
                    else {
                        await connection.query(
                            "update inventario set stock = ?, cantidad_apartado = ? where id_producto = UUID_TO_BIN(?);",
                            [newInventoryStock, detallesSeparatedProduct.cantidad, detallesSeparatedProduct.id_producto]
                        );
                    }
                }
                else {
                    const getDataProducts = await connection.query(
                        "select stock from inventario where id_producto = UUID_TO_BIN(?);",
                        [detallesSeparatedProduct.id_producto]
                    );
                    const [{ stock }] = (getDataProducts as any)[0];

                    const newStockInventory = stock - detallesSeparatedProduct.cantidad;
                    if (newStockInventory <= 0) {
                        return res.status(409).json({ error: "No hay suficiente stock en el inventario para crear la separación del producto..." });
                    }
                    else {
                        await connection.query(
                            "update inventario set stock = ?, cantidad_apartado = ? where id_producto = UUID_TO_BIN(?);",
                            [newStockInventory, detallesSeparatedProduct.cantidad, detallesSeparatedProduct.id_producto]
                        );

                        await connection.query(
                            "insert into detalle_producto_apartado(id_producto, precio_venta, cantidad, subtotal, id_inventario, id_producto_apartado) values(UUID_TO_BIN(?), ?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?))",
                            [
                                detallesSeparatedProduct.id_producto,
                                detallesSeparatedProduct.precio_venta,
                                detallesSeparatedProduct.cantidad,
                                detallesSeparatedProduct.subtotal,
                                detallesSeparatedProduct.id_inventario,
                                id
                            ]
                        );
                    }
                }

                await connection.query(
                    "update producto_apartado set termino = ?, observaciones = ?, subtotal = ?, total = ?, estado = ?, prefacturacion = ?, facturacion = ?, fecha_modificacion = now(), impuesto_manual = ?, id_cliente = UUID_TO_BIN(?), usuario_modificador = UUID_TO_BIN(?) where id = UUID_TO_BIN(?);",
                    [
                        termino,
                        observaciones,
                        subtotal,
                        total,
                        estado,
                        0,
                        0,
                        JSON.stringify(impuesto_manual),
                        id_cliente,
                        usuario_modificador,
                        id
                    ]

                );

                await connection.query(
                    "update detalle_producto_apartado set precio_venta = ?, cantidad = ?, subtotal = ?, id_producto = UUID_TO_BIN(?), id_inventario = UUID_TO_BIN(?) where id_producto = UUID_TO_BIN(?);",
                    [detallesSeparatedProduct.precio_venta, detallesSeparatedProduct.cantidad, detallesSeparatedProduct.subtotal, detallesSeparatedProduct.id_producto, detallesSeparatedProduct.id_inventario, detallesSeparatedProduct.id_producto]
                );
            }

            res.send("El apartado del producto se modifico correctamente...");
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    // * Cancel register by id separated product
    static cancelRegisterSeparatedProductById = async (req: Request, res: Response) => {
        const { id } = req.params;

        try {
            const getDetailsSeparatedProduct = await connection.query(
                "select BIN_TO_UUID(id_producto) as id_producto, cantidad, BIN_TO_UUID(id_inventario) as id_inventario from detalle_producto_apartado where id_producto_apartado = UUID_TO_BIN(?);",
                [id]
            );
            const [{ id_producto, cantidad, id_inventario }] = (getDetailsSeparatedProduct as any)[0];


            if (cantidad === 0) {
                const error = new Error("El producto que estas buscando no existe en el apartado...");
                return res.status(404).json({ error: error.message });
            }

            const getStockInventory = await connection.query(
                "select stock, cantidad_apartado from inventario where id_producto = UUID_TO_BIN(?);",
                [id_producto]
            );
            const [{ stock, cantidad_apartado }] = (getStockInventory as any)[0];

            const getAmmountDetailsRemission = await connection.query(
                "select cantidad as ammmountRemission from detalle_producto_apartado where id_producto = UUID_TO_BIN(?);",
                [id_producto]
            );
            const [{ ammmountRemission }] = (getAmmountDetailsRemission as any)[0];
            const resultNewStock = stock + ammmountRemission;
            const resultNewAmmount = ammmountRemission - cantidad_apartado;

            await connection.query(
                "update inventario set cantidad_apartado = ?, stock = ? where id_producto = UUID_TO_BIN(?);",
                [resultNewAmmount, resultNewStock, id_producto]
            );

            await connection.query(
                "update producto_apartado set estado = 0 where id = UUID_TO_BIN(?);",
                [id]
            );

            res.send("El apartado se anulo correctamente...");
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    // * Restored register by id separated product
    static restoredRegisterSeparatedProductById = async (req: Request, res: Response) => {
        const { id } = req.params;

        try {
            const getDetailsSeparatedProduct = await connection.query(
                "select BIN_TO_UUID(id_producto) as id_producto, cantidad, BIN_TO_UUID(id_inventario) as id_inventario from detalle_producto_apartado where id_producto_apartado = UUID_TO_BIN(?);",
                [id]
            );
            const [{ id_producto, cantidad, id_inventario }] = (getDetailsSeparatedProduct as any)[0];


            if (cantidad === 0) {
                const error = new Error("El producto que estas buscando no existe en el apartado...");
                return res.status(404).json({ error: error.message });
            }

            const getStockInventory = await connection.query(
                "select stock, cantidad_apartado from inventario where id_producto = UUID_TO_BIN(?);",
                [id_producto]
            );
            const [{ stock, cantidad_apartado }] = (getStockInventory as any)[0];

            const getAmmountDetailsRemission = await connection.query(
                "select cantidad as ammmountRemission from detalle_producto_apartado where id_producto = UUID_TO_BIN(?);",
                [id_producto]
            );
            const [{ ammmountRemission }] = (getAmmountDetailsRemission as any)[0];
            const resultNewStock = stock - ammmountRemission;
            const resultNewAmmount = ammmountRemission - cantidad_apartado;

            await connection.query(
                "update inventario set cantidad_apartado = ?, stock = ? where id_producto = UUID_TO_BIN(?);",
                [resultNewAmmount, resultNewStock, id_producto]
            );

            await connection.query(
                "update producto_apartado set estado = 1 where id = UUID_TO_BIN(?);",
                [id]
            );

            res.send("El apartado se restauro correctamente...");
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    // * delete product by id in separated
    static deleteProductSeparated = async (req: Request, res: Response) => {
        const { id } = req.params;
        const {
            id_producto,
            id_inventario
        } = req.body;
        try {
            const productExistsInInventory = await connection.query(
                "select count(BIN_TO_UUID(dpa.id_producto)) as existsProductInventory from detalle_producto_apartado dpa inner join inventario i on i.id=dpa.id_inventario where dpa.id_producto = UUID_TO_BIN(?) and dpa.id_inventario = UUID_TO_BIN(?) and dpa.id_producto_apartado = UUID_TO_BIN(?);",
                [id_producto, id_inventario, id]
            );
            const [{ existsProductInventory }] = (productExistsInInventory as any)[0];

            if (existsProductInventory > 0) {
                const existsProductInSeparated = await connection.query(
                    "select count(BIN_TO_UUID(id_producto)) as productExists from detalle_producto_apartado where id_producto = UUID_TO_BIN(?) and id_producto_apartado = UUID_TO_BIN(?);",
                    [id_producto, id]
                );
                const [{ productExists }] = (existsProductInSeparated as any)[0];
                if (productExists === 0) {
                    const error = new Error("El producto que estas buscando no existe en el apartado...");
                    return res.status(404).json({ error: error.message });
                }

                const getStockInventory = await connection.query(
                    "select stock, cantidad_apartado from inventario where id_producto = UUID_TO_BIN(?);",
                    [id_producto]
                );
                const [{ stock, cantidad_apartado }] = (getStockInventory as any)[0];

                const getAmmountDetailsRemission = await connection.query(
                    "select cantidad as ammmountRemission from detalle_producto_apartado where id_producto = UUID_TO_BIN(?);",
                    [id_producto]
                );
                const [{ ammmountRemission }] = (getAmmountDetailsRemission as any)[0];
                const resultNewStock = stock + ammmountRemission;

                if (cantidad_apartado === 0) {
                    await connection.query(
                        "update inventario set cantidad_apartado = null, stock = ? where id_producto = UUID_TO_BIN(?);",
                        [resultNewStock, id_producto]
                    );
                }
                else {
                    const resultNewAmmount = ammmountRemission - cantidad_apartado;

                    await connection.query(
                        "update inventario set cantidad_apartado = ?, stock = ? where id_producto = UUID_TO_BIN(?);",
                        [resultNewAmmount, resultNewStock, id_producto]
                    );
                }               

                await connection.query(
                    "delete from detalle_producto_apartado where id_producto = UUID_TO_BIN(?) and id_producto_apartado = UUID_TO_BIN(?);",
                    [id_producto, id]
                );   
                
                 const getDataSeparatedProduct = await connection.query(
                    "select dpa.subtotal, pa.impuesto_manual from detalle_producto_apartado dpa inner join producto_apartado pa on pa.id=dpa.id_producto_apartado where dpa.id_producto_apartado = UUID_TO_BIN(?);",
                    [id]
                );
                const [{ subtotal, impuesto_manual }] = (getDataSeparatedProduct as any)[0];

                impuesto_manual[0].valor_cantidad = parseFloat(
                    (subtotal * impuesto_manual[0].valor_porcentaje / 100).toFixed(2)
                );

                const newValueTax = impuesto_manual[0].valor_cantidad;
                const newTotal = parseFloat(newValueTax) + parseFloat(subtotal);

                await connection.query(
                    "update producto_apartado set subtotal = ?, impuesto_manual = ?, total = ? where id = UUID_TO_BIN(?);",
                    [subtotal, JSON.stringify(impuesto_manual), newTotal, id]
                );

                res.send("Producto eliminado correctamente...");
            }
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };
}