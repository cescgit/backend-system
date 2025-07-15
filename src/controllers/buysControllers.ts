import type { Request, Response } from "express";
import { connection } from "../config/db";
import { buysInterface } from "../interface/valueInterface";

export class BuysController {
    // * Get all buys
    static getAllBuys = async (req: Request, res: Response) => {
        try {
            const result = await connection.query(
                "select BIN_TO_UUID(c.id) as id, LPAD(c.numero_compra, 10, '0') AS numero_compra, c.numero_factura_proveedor, c.termino, c.observaciones, c.cuenta_por_pagar, c.impuesto_manual, c.subtotal, c.total, BIN_TO_UUID(pv.id) as id_proveedor, pv.nombre_proveedor as proveedor, c.fecha_creacion, coalesce(uc.nombre_usuario, '') as nombre_usuario_creador from compra c inner join proveedor pv on pv.id=c.id_proveedor left join usuario uc on uc.id=c.usuario_creador order by c.numero_compra desc;"
            );
            res.json(result[0]);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    // * Get details buys by id
    static getDetailsBuysById = async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            const result = await connection.query(
                "select BIN_TO_UUID(dc.id_producto) as id_producto, p.nombre_producto, dc.precio_compra, dc.cantidad, dc.subtotal from detalle_compra dc inner join producto p on p.id=dc.id_producto where BIN_TO_UUID(dc.id_compra) = ?;",
                [id]
            );
            res.json(result[0]);
        } catch (error: any) {
            res.status(500).json({ error: error.message })
        }
    }

    // *  Create new purcharse quote
    static createBuys = async (req: Request, res: Response) => {
        const buys = <buysInterface>req.body;

        const {
            numero_factura_proveedor,
            termino,
            observaciones,
            subtotal,
            total,
            cuenta_por_pagar,
            impuesto_manual,
            id_proveedor,
            usuario_creador,
            estado,
            fecha_vencimiento,
            detalles_compra
        } = buys;

        try {
            // * query to check if the user exists in the database
            const userExists = await connection.query(
                "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
                [usuario_creador]
            );
            const [{ idUser }] = (userExists as any)[0];
            if (idUser === 0) {
                const error = new Error("El usuario que esta intentando crear esta compra no existe en la base de datos...");
                return res.status(409).json({ error: error.message });
            }

            // * query to check if the supplier exists in the database
            const supplierExists = await connection.query(
                "select count(BIN_TO_UUID(id)) as idSupplier from proveedor where BIN_TO_UUID(id) = ?;",
                [id_proveedor]
            );
            const [{ idSupplier }] = (supplierExists as any)[0];
            if (idSupplier === 0) {
                const error = new Error("El proveedor que esta buscando no existe en la base de datos...");
                return res.status(409).json({ error: error.message });
            }

            // * query to check if the number invoice exists in the database
            const numberInvoiceSupplierExists = await connection.query(
                "select count(numero_factura_proveedor) as valueNumberSupplier from compra where numero_factura_proveedor = ? and BIN_TO_UUID(id_proveedor) = ?;",
                [numero_factura_proveedor, id_proveedor]
            );
            const [{ valueNumberSupplier }] = (numberInvoiceSupplierExists as any)[0];
            if (valueNumberSupplier === 1) {
                const error = new Error(
                    "Este número de factura del proveedor ya existen en la base de datos..."
                );
                return res.status(409).json({ error: error.message });
            }

            const uuId = await connection.query("select UUID() as getIdBuys;")
            const [{ getIdBuys }] = (uuId as any)[0];

            await connection.query(
                "insert into compra (id, numero_factura_proveedor, termino, observaciones, subtotal, total, cuenta_por_pagar, impuesto_manual, id_proveedor, fecha_creacion, usuario_creador) values (UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?, ?, UUID_TO_BIN(?), now(), UUID_TO_BIN(?));",
                [
                    getIdBuys,
                    numero_factura_proveedor,
                    termino,
                    observaciones,
                    subtotal,
                    total,
                    cuenta_por_pagar,
                    JSON.stringify(impuesto_manual),
                    id_proveedor,
                    usuario_creador
                ]
            );

            for (const detallesCompra of detalles_compra) {

                const productExists = await connection.query(
                    "select count(BIN_TO_UUID(id)) as idProduct from producto where BIN_TO_UUID(id) = ?;",
                    [detallesCompra.id_producto]
                );
                const [{ idProduct }] = (productExists as any)[0];
                if (idProduct === 0) {
                    const error = new Error("El producto que esta buscando no existe en la base de datos...");
                    return res.status(409).json({ error: error.message });
                }

                await connection.query(
                    "insert into detalle_compra (cantidad, precio_compra, subtotal, id_producto, id_compra) values (?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?));",
                    [
                        detallesCompra.cantidad,
                        detallesCompra.precio_compra,
                        detallesCompra.subtotal,
                        detallesCompra.id_producto,
                        getIdBuys
                    ]
                );

                const getExistsbyKardex = await connection.query(
                    "select count(k.cantidad_disponible) as existsProducts from kardex k inner join producto p on p.id=k.id_producto where BIN_TO_UUID(k.id_producto) = ?;",
                    [detallesCompra.id_producto]
                )
                const [{ existsProducts }] = (getExistsbyKardex as any)[0];

                if (existsProducts === 0) {

                    await connection.query(
                        "insert into kardex(descripcion, tipo, cantidad_entrada, precio_entrada, total_entrada, cantidad_salida, precio_salida, precio_facturacion, total_salida, cantidad_disponible, precio_disponible, total_disponible, fecha_creacion, usuario_creador, id_producto, id_compra) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));",
                        [buys.observaciones, 'Compra', detallesCompra.cantidad, detallesCompra.precio_compra, detallesCompra.subtotal, '0', '0', '0', '0', detallesCompra.cantidad, detallesCompra.precio_compra, detallesCompra.subtotal, usuario_creador, detallesCompra.id_producto, getIdBuys]
                    );

                    const getEarningProductById = await connection.query(
                        "select utilidad1, utilidad2, utilidad3, utilidad4 from producto where BIN_TO_UUID(id) = ?;",
                        [detallesCompra.id_producto]
                    )

                    const [{ utilidad1, utilidad2, utilidad3, utilidad4 }] = (getEarningProductById as any)[0];

                    const earningNew1 = 100 - utilidad1;
                    const result1 = earningNew1 / 100;
                    const resultEarning1 = +detallesCompra.precio_compra / result1;

                    const earningNew2 = 100 - utilidad2;
                    const result2 = earningNew2 / 100;
                    const resultEarning2 = +detallesCompra.precio_compra / result2;

                    const earningNew3 = 100 - utilidad3;
                    const result3 = earningNew3 / 100;
                    const resultEarning3 = +detallesCompra.precio_compra / result3;

                    const earningNew4 = 100 - utilidad4;
                    const result4 = earningNew4 / 100;
                    const resultEarning4 = +detallesCompra.precio_compra / result4;

                    await connection.query(
                        "update producto set precio1 = ?, precio2 = ?, precio3 = ?, precio4 = ?, precio_compra = ? where BIN_TO_UUID(id) = ?;",
                        [
                            resultEarning1,
                            resultEarning2,
                            resultEarning3,
                            resultEarning4,
                            detallesCompra.precio_compra,
                            detallesCompra.id_producto
                        ]

                    )
                }
                else {
                    const getStockbyKardex = await connection.query(
                        "select k.fecha_creacion, k.cantidad_disponible, k.total_disponible from kardex k inner join  producto p on p.id=k.id_producto where BIN_TO_UUID(k.id_producto) = ? order by k.fecha_creacion desc;",
                        [detallesCompra.id_producto]
                    )
                    const [{ cantidad_disponible, total_disponible }] = (getStockbyKardex as any)[0];

                    const resultCantidadNew = cantidad_disponible + detallesCompra.cantidad;
                    const resultTotal = parseInt(total_disponible) + parseInt(detallesCompra.subtotal.toString());
                    const resultNewPricing = resultTotal / resultCantidadNew;

                    const getEarningProductById = await connection.query(
                        "select utilidad1, utilidad2, utilidad3, utilidad4 from producto where BIN_TO_UUID(id) = ?;",
                        [detallesCompra.id_producto]
                    )
                    const [{ utilidad1, utilidad2, utilidad3, utilidad4 }] = (getEarningProductById as any)[0];

                    const earningNew1 = 100 - utilidad1;
                    const result1 = earningNew1 / 100;
                    const resultEarning1 = +resultNewPricing / result1;


                    const earningNew2 = 100 - utilidad2;
                    const result2 = earningNew2 / 100;
                    const resultEarning2 = +resultNewPricing / result2;

                    const earningNew3 = 100 - utilidad3;
                    const result3 = earningNew3 / 100;
                    const resultEarning3 = +resultNewPricing / result3;

                    const earningNew4 = 100 - utilidad4;
                    const result4 = earningNew4 / 100;
                    const resultEarning4 = +resultNewPricing / result4;

                    const queryExec = [
                        connection.query(
                            "update producto set precio1 = ?, precio2 = ?, precio3 = ?, precio4 = ?, precio_compra = ?, precio_venta_promedio = ? where BIN_TO_UUID(id) = ?;",
                            [
                                resultEarning1,
                                resultEarning2,
                                resultEarning3,
                                resultEarning4,
                                detallesCompra.precio_compra,
                                resultNewPricing,
                                detallesCompra.id_producto
                            ]
                        ),

                        connection.query(
                            "insert into kardex(descripcion, tipo, cantidad_entrada, precio_entrada, total_entrada, cantidad_salida, precio_salida, precio_facturacion, total_salida, cantidad_disponible, precio_disponible, total_disponible, fecha_creacion, usuario_creador, id_producto, id_compra) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));",
                            [buys.observaciones, 'Compra', detallesCompra.cantidad, detallesCompra.precio_compra, detallesCompra.subtotal, '0', '0', '0', '0', resultCantidadNew, resultNewPricing, resultTotal, usuario_creador, detallesCompra.id_producto, getIdBuys]
                        )
                    ]

                    await Promise.all(queryExec);
                }

                const getStockbyInventory = await connection.query(
                    "select count(i.stock) as stock from inventario i  inner join producto p on p.id=i.id_producto inner join detalle_compra dc on dc.id_producto=p.id where BIN_TO_UUID(i.id_producto) = ?;",
                    [detallesCompra.id_producto]
                )
                const [{ stock }] = (getStockbyInventory as any)[0];
                if (stock === 0) {
                    await connection.query(
                        "insert into inventario (stock, id_producto, id_compra) values (?, UUID_TO_BIN(?), UUID_TO_BIN(?));",
                        [
                            detallesCompra.cantidad,
                            detallesCompra.id_producto,
                            getIdBuys
                        ]
                    );
                }
                else {
                    await connection.query(
                        "update inventario set stock = stock + ? where BIN_TO_UUID(id_producto) = ?;",
                        [
                            detallesCompra.cantidad,
                            detallesCompra.id_producto
                        ]
                    );
                }
            }

            if (cuenta_por_pagar == true) {
                const resultNumberBuys = await connection.query(
                    "select LPAD(numero_compra, 10, '0') AS numberBuys from compra order by numero_compra desc limit 1;"
                );

                // * get number of buys
                const [{ numberBuys }] = (resultNumberBuys as any)[0];
                const descriptionBalanceSupplier = `Compra N° ${numberBuys}`;

                const uuIdBalanceSupplier = await connection.query("select UUID() as getIdBalanceSupplier;")
                const [{ getIdBalanceSupplier }] = (uuIdBalanceSupplier as any)[0];

                // * insert data in the first register of balance supplier
                await connection.query(
                    "insert into balance_proveedor(id, descripcion, fecha_emision, fecha_vencimiento, debito, credito, balance, estado, estado_credito, id_compra, usuario_creador, id_proveedor) values (UUID_TO_BIN(?), ?, now(), ?, ?, ?, ?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));",
                    [
                        getIdBalanceSupplier,
                        descriptionBalanceSupplier,
                        fecha_vencimiento,
                        "0",
                        total,
                        total,
                        estado,
                        0,
                        getIdBuys,
                        usuario_creador,
                        id_proveedor
                    ]
                );

                await connection.query(
                    "insert into detalle_balance_proveedor(descripcion, fecha_emision, fecha_vencimiento, debito, credito, balance, estado, id_balance_proveedor, usuario_creador, id_proveedor) values (?, now(), ?, ?, ?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));",
                    [
                        descriptionBalanceSupplier,
                        fecha_vencimiento,
                        "0",
                        total,
                        total,
                        estado,
                        getIdBalanceSupplier,
                        usuario_creador,
                        id_proveedor
                    ]
                );
            }
            res.send("La compra se creo correctamente...");
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };
}