import type { Request, Response } from "express";
import { connection } from "../config/db";
import { salesInterface } from "../interface/valueInterface";

export class SalesController {
    // * Get all sales
    static getAllSales = async (req: Request, res: Response) => {
        try {
            const result = await connection.query(
                "select BIN_TO_UUID(v.id) as id, LPAD(v.numero_venta, 10, '0') AS numero_venta, v.termino, v.observaciones, v.cuenta_por_cobrar, v.impuesto_manual, v.subtotal, v.total, BIN_TO_UUID(cl.id) as id_cliente, cl.nombre_cliente as cliente, v.fecha_creacion, coalesce(uc.nombre_usuario, '') as nombre_usuario_creador from venta v inner join cliente cl on cl.id=v.id_cliente left join usuario uc on uc.id=v.usuario_creador order by v.numero_venta desc;"
            );
            res.json(result[0]);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    // * Get details sales by id
    static getDetailsSalesById = async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            const result = await connection.query(
                "select BIN_TO_UUID(dv.id_producto) as id_producto, p.nombre_producto, dv.precio_venta, dv.cantidad, dv.subtotal from detalle_venta dv inner join producto p on p.id=dv.id_producto where BIN_TO_UUID(dv.id_venta) = ?;",
                [id]
            );
            res.json(result[0]);
        } catch (error: any) {
            res.status(500).json({ error: error.message })
        }
    }

    // *  Create new sales
    static createSales = async (req: Request, res: Response) => {
        const sales = <salesInterface>req.body;

        const {
            termino,
            observaciones,
            subtotal,
            total,
            cuenta_por_cobrar,
            impuesto_manual,
            fecha_vencimiento,
            id_cliente,
            usuario_creador,
            estado,
            detalles_venta
        } = sales;

        try {
            // * query to check if the user exists in the database
            const userExists = await connection.query(
                "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
                [usuario_creador]
            );
            const [{ idUser }] = (userExists as any)[0];
            if (idUser === 0) {
                const error = new Error("El usuario que esta intentando crear esta venta no existe en la base de datos...");
                return res.status(409).json({ error: error.message });
            }

            // * query to check if the customer exists in the database
            const customerExists = await connection.query(
                "select count(BIN_TO_UUID(id)) as idCustomer from cliente where BIN_TO_UUID(id) = ?;",
                [id_cliente]
            );
            const [{ idCustomer }] = (customerExists as any)[0];
            if (idCustomer === 0) {
                const error = new Error("El cliente que esta buscando no existe en la base de datos...");
                return res.status(409).json({ error: error.message });
            }

            const uuId = await connection.query("select UUID() as getIdSales;")
            const [{ getIdSales }] = (uuId as any)[0];

            await connection.query(
                "insert into venta (id, termino, observaciones, subtotal, total, cuenta_por_cobrar, impuesto_manual, id_cliente, fecha_creacion, usuario_creador) values (UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?, UUID_TO_BIN(?), now(), UUID_TO_BIN(?));",
                [
                    getIdSales,
                    termino,
                    observaciones,
                    subtotal,
                    total,
                    cuenta_por_cobrar,
                    JSON.stringify(impuesto_manual),
                    id_cliente,
                    usuario_creador
                ]
            );

            for (const detallesVenta of detalles_venta) {

                const productExists = await connection.query(
                    "select count(BIN_TO_UUID(id)) as idProduct from producto where BIN_TO_UUID(id) = ?;",
                    [detallesVenta.id_producto]
                );
                const [{ idProduct }] = (productExists as any)[0];
                if (idProduct === 0) {
                    const error = new Error("El producto que esta buscando no existe en la base de datos...");
                    return res.status(409).json({ error: error.message });
                }

                await connection.query(
                    "insert into detalle_venta (cantidad, precio_venta, subtotal, id_producto, id_inventario, id_venta) values (?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));",
                    [
                        detallesVenta.cantidad,
                        detallesVenta.precio_venta,
                        detallesVenta.subtotal,
                        detallesVenta.id_producto,
                        detallesVenta.id_inventario,
                        getIdSales
                    ]
                );

                const getStockbyKardex = await connection.query(
                    "select k.fecha_creacion, k.precio_disponible, k.cantidad_disponible, k.total_disponible from kardex k inner join  producto p on p.id=k.id_producto where BIN_TO_UUID(k.id_producto) = ? order by k.fecha_creacion desc;",
                    [detallesVenta.id_producto]
                )
                const [{ precio_disponible, cantidad_disponible, total_disponible }] = (getStockbyKardex as any)[0];

                const resultCantidadNew = cantidad_disponible - detallesVenta.cantidad;                
                const resultTotal = parseInt(total_disponible) - parseInt(detallesVenta.subtotal.toString());
                const resultNewPricing = resultTotal / resultCantidadNew;                

                const getEarningProductById = await connection.query(
                    "select utilidad1, utilidad2, utilidad3, utilidad4 from producto where BIN_TO_UUID(id) = ?;",
                    [detallesVenta.id_producto]
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

                await connection.query(
                    "update producto set precio1 = ?, precio2 = ?, precio3 = ?, precio4 = ?, precio_compra = ? where BIN_TO_UUID(id) = ?;",
                    [
                        resultEarning1,
                        resultEarning2,
                        resultEarning3,
                        resultEarning4,
                        resultNewPricing,
                        detallesVenta.id_producto
                    ]
                );

                await connection.query(
                    "insert into kardex(descripcion, tipo, cantidad_entrada, precio_entrada, total_entrada, cantidad_salida, precio_salida, total_salida, precio_facturacion, cantidad_disponible, precio_disponible, total_disponible, fecha_creacion, usuario_creador, id_producto, id_venta) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));",
                    [
                        sales.observaciones,
                        'Facturación',
                        "0",
                        "0",
                        "0",
                        detallesVenta.cantidad,
                        precio_disponible,
                        detallesVenta.subtotal,
                        detallesVenta.precio_venta,
                        resultCantidadNew,
                        resultNewPricing,
                        resultTotal,
                        usuario_creador,
                        detallesVenta.id_producto,
                        getIdSales
                    ]
                );

                await connection.query(
                    "update inventario set stock = stock - ? where BIN_TO_UUID(id_producto) = ?;",
                    [
                        detallesVenta.cantidad,
                        detallesVenta.id_producto
                    ]
                );
            }

            if (cuenta_por_cobrar == true) {
                // * query to check if the supplier balance exists in the database
                const customerExistsInBalance = await connection.query(
                    "select count(BIN_TO_UUID(id_cliente)) as customerExistsBalance from balance_cliente where BIN_TO_UUID(id_cliente) = ?;",
                    [id_cliente]
                );
                const [{ customerExistsBalance }] = (customerExistsInBalance as any)[0];

                if (customerExistsBalance >= 1) {
                    // * get the debit, credit and balance of the customer
                    const resultDataBalanceCustomer = await connection.query(
                        "select balance as totalBalance, BIN_TO_UUID(id_cliente) as idCustomer from balance_cliente where BIN_TO_UUID(id_cliente) = ?;",
                        [id_cliente]
                    );

                    const [{                        
                        totalBalance
                    }] = (resultDataBalanceCustomer as any)[0];

                    // * get number of sales
                    const resultNumberSales = await connection.query(
                        "select LPAD(numero_venta, 10, '0') AS numberSale from venta order by numero_venta desc limit 1;"
                    );

                    const [{ numberSale }] = (resultNumberSales as any)[0];
                    const descriptionBalanceCustomer = `Factura N° ${numberSale}`;

                    // * create operation balance customer
                    const totalBalanceCustomer = totalBalance - parseInt(total.toString());

                    const uuIdBalanceCustomer = await connection.query("select UUID() as getIdBalanceCustomer;")
                    const [{ getIdBalanceCustomer }] = (uuIdBalanceCustomer as any)[0];

                    await connection.query(
                        "insert into balance_cliente(id, descripcion, fecha_emision, fecha_vencimiento, debito, credito, balance, estado, estado_credito, id_venta, usuario_creador, id_cliente) values (UUID_TO_BIN(?), ?, now(), ?, ?, ?, ?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));",
                        [
                            getIdBalanceCustomer,
                            descriptionBalanceCustomer,
                            fecha_vencimiento,
                            "0",
                            total,
                            totalBalanceCustomer,
                            estado,
                            0,
                            getIdBalanceCustomer,
                            usuario_creador,
                            id_cliente
                        ]
                    );

                    await connection.query(
                        "insert into detalle_balance_cliente(descripcion, fecha_emision, fecha_vencimiento, debito, credito, balance, estado, id_balance_cliente, usuario_creador, id_cliente) values (?, now(), ?, ?, ?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));",
                        [
                            descriptionBalanceCustomer,
                            fecha_vencimiento,
                            "0",
                            total,
                            totalBalanceCustomer,
                            estado,
                            getIdBalanceCustomer,
                            usuario_creador,
                            id_cliente
                        ]
                    );
                }
                else if (customerExistsBalance == 0) {

                    const resultNumberBuys = await connection.query(
                        "select LPAD(numero_venta, 10, '0') AS numberSale from venta order by numero_venta desc limit 1;"
                    );

                    // * get number of buys
                    const [{ numberSale }] = (resultNumberBuys as any)[0];
                    const descriptionBalanceCustomers = `Factura N° ${numberSale}`;

                    const uuIdBalanceCustomer = await connection.query("select UUID() as getIdBalanceSupplier;")
                    const [{ getIdBalanceSupplier }] = (uuIdBalanceCustomer as any)[0];

                    // * insert data in the first register of balance customer
                    await connection.query(
                        "insert into balance_cliente(id, descripcion, fecha_emision, fecha_vencimiento, debito, credito, balance, estado, estado_credito, id_venta, usuario_creador, id_cliente) values (UUID_TO_BIN(?), ?, now(), ?, ?, ?, ?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));",
                        [
                            getIdBalanceSupplier,
                            descriptionBalanceCustomers,
                            fecha_vencimiento,
                            "0",
                            total,
                            total,
                            estado,
                            0,
                            getIdSales,
                            usuario_creador,
                            id_cliente
                        ]
                    );

                    await connection.query(
                        "insert into detalle_balance_cliente(descripcion, fecha_emision, fecha_vencimiento, debito, credito, balance, estado, id_balance_cliente, usuario_creador, id_cliente) values (?, now(), ?, ?, ?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));",
                        [
                            descriptionBalanceCustomers,
                            fecha_vencimiento,
                            "0",
                            total,
                            total,
                            estado,
                            getIdBalanceSupplier,
                            usuario_creador,
                            id_cliente
                        ]
                    );
                }
            }
            res.send("La factura se creo correctamente...");
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    // *  Create a sale from a sales quote
    static createSalesFromSalesQuote = async (req: Request, res: Response) => {
        const { idSalesQuote } = req.params;
        const sales = <salesInterface>req.body;

        const {
            termino,
            observaciones,
            subtotal,
            total,
            cuenta_por_cobrar,
            impuesto_manual,
            fecha_vencimiento,
            id_cliente,
            usuario_creador,
            estado,
            detalles_venta
        } = sales;

        try {
            // * query to check if the user exists in the database
            const userExists = await connection.query(
                "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
                [usuario_creador]
            );
            const [{ idUser }] = (userExists as any)[0];
            if (idUser === 0) {
                const error = new Error("El usuario que esta intentando crear esta facturación no existe en la base de datos...");
                return res.status(409).json({ error: error.message });
            }

            // * query to check if the customer exists in the database
            const customerExists = await connection.query(
                "select count(BIN_TO_UUID(id)) as idCustomer from cliente where BIN_TO_UUID(id) = ?;",
                [id_cliente]
            );
            const [{ idCustomer }] = (customerExists as any)[0];
            if (idCustomer === 0) {
                const error = new Error("El cliente que esta buscando no existe en la base de datos...");
                return res.status(409).json({ error: error.message });
            }

            const salesQuoteExists = await connection.query(
                "select count(BIN_TO_UUID(id)) as idSalesQuoteExists from cotizacion_venta where BIN_TO_UUID(id) = ?;",
                [idSalesQuote]
            );
            const [{ idSalesQuoteExists }] = (salesQuoteExists as any)[0];
            if (idSalesQuoteExists === 0) {
                const error = new Error("Esta proforma que esta buscando no existe en la base de datos...");
                return res.status(409).json({ error: error.message });
            }

            const uuId = await connection.query("select UUID() as getIdSales;")
            const [{ getIdSales }] = (uuId as any)[0];

            await connection.query(
                "insert into venta (id, termino, observaciones, subtotal, total, estado, cuenta_por_cobrar, impuesto_manual, id_cliente, fecha_creacion, usuario_creador) values (UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?, ?, UUID_TO_BIN(?), now(), UUID_TO_BIN(?));",
                [
                    getIdSales,
                    termino,
                    observaciones,
                    subtotal,
                    total,
                    estado,
                    cuenta_por_cobrar,
                    JSON.stringify(impuesto_manual),
                    id_cliente,
                    usuario_creador
                ]
            );

            await connection.query(
                "update cotizacion_venta set facturacion = 1 where id = UUID_TO_BIN(?);",
                [idSalesQuote]
            );

            for (const detallesVenta of detalles_venta) {
                const productExists = await connection.query(
                    "select count(BIN_TO_UUID(id)) as idProduct from producto where BIN_TO_UUID(id) = ?;",
                    [detallesVenta.id_producto]
                );
                const [{ idProduct }] = (productExists as any)[0];
                if (idProduct === 0) {
                    const error = new Error("El producto que esta buscando no existe en la base de datos...");
                    return res.status(409).json({ error: error.message });
                }

                await connection.query(
                    "insert into detalle_venta (cantidad, precio_venta, subtotal, id_producto, id_inventario, id_venta) values (?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));",
                    [
                        detallesVenta.cantidad,
                        detallesVenta.precio_venta,
                        detallesVenta.subtotal,
                        detallesVenta.id_producto,
                        detallesVenta.id_inventario,
                        getIdSales
                    ]
                );
                
                await connection.query(
                    "update inventario set stock = stock - ? where BIN_TO_UUID(id_producto) = ?;",
                    [
                        detallesVenta.cantidad,
                        detallesVenta.id_producto
                    ]
                );
            }

            if (cuenta_por_cobrar == true) {
                // * query to check if the supplier balance exists in the database
                const customerExistsInBalance = await connection.query(
                    "select count(BIN_TO_UUID(id_cliente)) as customerExistsBalance from balance_cliente where BIN_TO_UUID(id_cliente) = ?;",
                    [id_cliente]
                );
                const [{ customerExistsBalance }] = (customerExistsInBalance as any)[0];

                if (customerExistsBalance >= 1) {
                    // * get the debit, credit and balance of the customer
                    const resultDataBalanceCustomer = await connection.query(
                        "select balance as totalBalance, BIN_TO_UUID(id_cliente) as idCustomer from balance_cliente where BIN_TO_UUID(id_cliente) = ?;",
                        [id_cliente]
                    );

                    const [{                        
                        totalBalance
                    }] = (resultDataBalanceCustomer as any)[0];

                    // * get number of sales
                    const resultNumberSales = await connection.query(
                        "select LPAD(numero_venta, 10, '0') AS numberSale from venta order by numero_venta desc limit 1;"
                    );

                    const [{ numberSale }] = (resultNumberSales as any)[0];
                    const descriptionBalanceCustomer = `Factura N° ${numberSale}`;

                    // * create operation balance customer
                    const totalBalanceCustomer = totalBalance - parseInt(total.toString());

                    const uuIdBalanceCustomer = await connection.query("select UUID() as getIdBalanceCustomer;")
                    const [{ getIdBalanceCustomer }] = (uuIdBalanceCustomer as any)[0];

                    await connection.query(
                        "insert into balance_cliente(id, descripcion, fecha_emision, fecha_vencimiento, debito, credito, balance, estado, estado_credito, id_venta, usuario_creador, id_cliente) values (UUID_TO_BIN(?), ?, now(), ?, ?, ?, ?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));",
                        [
                            getIdBalanceCustomer,
                            descriptionBalanceCustomer,
                            fecha_vencimiento,
                            "0",
                            total,
                            totalBalanceCustomer,
                            estado,
                            0,
                            getIdBalanceCustomer,
                            usuario_creador,
                            id_cliente
                        ]
                    );

                    await connection.query(
                        "insert into detalle_balance_cliente(descripcion, fecha_emision, fecha_vencimiento, debito, credito, balance, estado, id_balance_cliente, usuario_creador, id_cliente) values (?, now(), ?, ?, ?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));",
                        [
                            descriptionBalanceCustomer,
                            fecha_vencimiento,
                            "0",
                            total,
                            totalBalanceCustomer,
                            estado,
                            getIdBalanceCustomer,
                            usuario_creador,
                            id_cliente
                        ]
                    );
                }
                else if (customerExistsBalance == 0) {

                    const resultNumberBuys = await connection.query(
                        "select LPAD(numero_venta, 10, '0') AS numberSale from venta order by numero_venta desc limit 1;"
                    );

                    // * get number of buys
                    const [{ numberSale }] = (resultNumberBuys as any)[0];
                    const descriptionBalanceCustomers = `Factura N° ${numberSale}`;

                    const uuIdBalanceCustomer = await connection.query("select UUID() as getIdBalanceSupplier;")
                    const [{ getIdBalanceSupplier }] = (uuIdBalanceCustomer as any)[0];

                    // * insert data in the first register of balance customer
                    await connection.query(
                        "insert into balance_cliente(id, descripcion, fecha_emision, fecha_vencimiento, debito, credito, balance, estado, estado_credito, id_venta, usuario_creador, id_cliente) values (UUID_TO_BIN(?), ?, now(), ?, ?, ?, ?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));",
                        [
                            getIdBalanceSupplier,
                            descriptionBalanceCustomers,
                            fecha_vencimiento,
                            "0",
                            total,
                            total,
                            estado,
                            0,
                            getIdSales,
                            usuario_creador,
                            id_cliente
                        ]
                    );

                    await connection.query(
                        "insert into detalle_balance_cliente(descripcion, fecha_emision, fecha_vencimiento, debito, credito, balance, estado, id_balance_cliente, usuario_creador, id_cliente) values (?, now(), ?, ?, ?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));",
                        [
                            descriptionBalanceCustomers,
                            fecha_vencimiento,
                            "0",
                            total,
                            total,
                            estado,
                            getIdBalanceSupplier,
                            usuario_creador,
                            id_cliente
                        ]
                    );
                }
            }

            res.send("La factura se creo correctamente...");
        } catch (error: any) {            
            res.status(500).json({ error: error.message });
        }
    };

    // *  Create a sale from a separated product
    static createSalesFromSeparatedProduct = async (req: Request, res: Response) => {
        const { idSeparatedProduct } = req.params;
        const sales = <salesInterface>req.body;

        const {
            termino,
            observaciones,
            subtotal,
            total,
            cuenta_por_cobrar,
            impuesto_manual,
            fecha_vencimiento,
            id_cliente,
            usuario_creador,
            estado,
            detalles_venta
        } = sales;

        try {
            // * query to check if the user exists in the database
            const userExists = await connection.query(
                "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
                [usuario_creador]
            );
            const [{ idUser }] = (userExists as any)[0];
            if (idUser === 0) {
                const error = new Error("El usuario que esta intentando crear esta facturación no existe en la base de datos...");
                return res.status(409).json({ error: error.message });
            }

            // * query to check if the customer exists in the database
            const customerExists = await connection.query(
                "select count(BIN_TO_UUID(id)) as idCustomer from cliente where BIN_TO_UUID(id) = ?;",
                [id_cliente]
            );
            const [{ idCustomer }] = (customerExists as any)[0];
            if (idCustomer === 0) {
                const error = new Error("El cliente que esta buscando no existe en la base de datos...");
                return res.status(409).json({ error: error.message });
            }

            const separatedProductteExists = await connection.query(
                "select count(BIN_TO_UUID(id)) as idSeparatedProducttExists from producto_apartado where id = UUID_TO_BIN(?);",
                [idSeparatedProduct]
            );
            const [{ idSeparatedProducttExists }] = (separatedProductteExists as any)[0];
            if (idSeparatedProducttExists === 0) {
                const error = new Error("Este apartado de producto que estas buscando no existe en la base de datos...");
                return res.status(409).json({ error: error.message });
            }

            const uuId = await connection.query("select UUID() as getIdSales;")
            const [{ getIdSales }] = (uuId as any)[0];

            await connection.query(
                "insert into venta (id, termino, observaciones, subtotal, total, estado, cuenta_por_cobrar, impuesto_manual, id_cliente, fecha_creacion, usuario_creador) values (UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?, ?, UUID_TO_BIN(?), now(), UUID_TO_BIN(?));",
                [
                    getIdSales,
                    termino,
                    observaciones,
                    subtotal,
                    total,
                    estado,
                    cuenta_por_cobrar,
                    JSON.stringify(impuesto_manual),
                    id_cliente,
                    usuario_creador
                ]
            );

            await connection.query(
                "update producto_apartado set facturacion = 1 where id = UUID_TO_BIN(?);",
                [idSeparatedProduct]
            );

            for (const detallesVenta of detalles_venta) {
                const productExists = await connection.query(
                    "select count(BIN_TO_UUID(id)) as idProduct from producto where BIN_TO_UUID(id) = ?;",
                    [detallesVenta.id_producto]
                );
                const [{ idProduct }] = (productExists as any)[0];
                if (idProduct === 0) {
                    const error = new Error("El producto que esta buscando no existe en la base de datos...");
                    return res.status(409).json({ error: error.message });
                }

                await connection.query(
                    "insert into detalle_venta (cantidad, precio_venta, subtotal, id_producto, id_inventario, id_venta) values (?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));",
                    [
                        detallesVenta.cantidad,
                        detallesVenta.precio_venta,
                        detallesVenta.subtotal,
                        detallesVenta.id_producto,
                        detallesVenta.id_inventario,
                        getIdSales
                    ]
                );

                await connection.query(
                    "update inventario set stock = stock - ? where BIN_TO_UUID(id_producto) = ?;",
                    [
                        detallesVenta.cantidad,
                        detallesVenta.id_producto
                    ]
                );
            }

            if (cuenta_por_cobrar == true) {
                // * query to check if the supplier balance exists in the database
                const customerExistsInBalance = await connection.query(
                    "select count(BIN_TO_UUID(id_cliente)) as customerExistsBalance from balance_cliente where BIN_TO_UUID(id_cliente) = ?;",
                    [id_cliente]
                );
                const [{ customerExistsBalance }] = (customerExistsInBalance as any)[0];

                if (customerExistsBalance >= 1) {
                    // * get the debit, credit and balance of the customer
                    const resultDataBalanceCustomer = await connection.query(
                        "select balance as totalBalance, BIN_TO_UUID(id_cliente) as idCustomer from balance_cliente where BIN_TO_UUID(id_cliente) = ?;",
                        [id_cliente]
                    );

                    const [{                        
                        totalBalance
                    }] = (resultDataBalanceCustomer as any)[0];

                    // * get number of sales
                    const resultNumberSales = await connection.query(
                        "select LPAD(numero_venta, 10, '0') AS numberSale from venta order by numero_venta desc limit 1;"
                    );

                    const [{ numberSale }] = (resultNumberSales as any)[0];
                    const descriptionBalanceCustomer = `Factura N° ${numberSale}`;

                    // * create operation balance customer
                    const totalBalanceCustomer = totalBalance - parseInt(total.toString());

                    const uuIdBalanceCustomer = await connection.query("select UUID() as getIdBalanceCustomer;")
                    const [{ getIdBalanceCustomer }] = (uuIdBalanceCustomer as any)[0];

                    await connection.query(
                        "insert into balance_cliente(id, descripcion, fecha_emision, fecha_vencimiento, debito, credito, balance, estado, estado_credito, id_venta, usuario_creador, id_cliente) values (UUID_TO_BIN(?), ?, now(), ?, ?, ?, ?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));",
                        [
                            getIdBalanceCustomer,
                            descriptionBalanceCustomer,
                            fecha_vencimiento,
                            "0",
                            total,
                            totalBalanceCustomer,
                            estado,
                            0,
                            getIdBalanceCustomer,
                            usuario_creador,
                            id_cliente
                        ]
                    );

                    await connection.query(
                        "insert into detalle_balance_cliente(descripcion, fecha_emision, fecha_vencimiento, debito, credito, balance, estado, id_balance_cliente, usuario_creador, id_cliente) values (?, now(), ?, ?, ?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));",
                        [
                            descriptionBalanceCustomer,
                            fecha_vencimiento,
                            "0",
                            total,
                            totalBalanceCustomer,
                            estado,
                            getIdBalanceCustomer,
                            usuario_creador,
                            id_cliente
                        ]
                    );
                }
                else if (customerExistsBalance == 0) {

                    const resultNumberBuys = await connection.query(
                        "select LPAD(numero_venta, 10, '0') AS numberSale from venta order by numero_venta desc limit 1;"
                    );

                    // * get number of buys
                    const [{ numberSale }] = (resultNumberBuys as any)[0];
                    const descriptionBalanceCustomers = `Factura N° ${numberSale}`;

                    const uuIdBalanceCustomer = await connection.query("select UUID() as getIdBalanceSupplier;")
                    const [{ getIdBalanceSupplier }] = (uuIdBalanceCustomer as any)[0];

                    // * insert data in the first register of balance customer
                    await connection.query(
                        "insert into balance_cliente(id, descripcion, fecha_emision, fecha_vencimiento, debito, credito, balance, estado, estado_credito, id_venta, usuario_creador, id_cliente) values (UUID_TO_BIN(?), ?, now(), ?, ?, ?, ?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));",
                        [
                            getIdBalanceSupplier,
                            descriptionBalanceCustomers,
                            fecha_vencimiento,
                            "0",
                            total,
                            total,
                            estado,
                            0,
                            getIdSales,
                            usuario_creador,
                            id_cliente
                        ]
                    );

                    await connection.query(
                        "insert into detalle_balance_cliente(descripcion, fecha_emision, fecha_vencimiento, debito, credito, balance, estado, id_balance_cliente, usuario_creador, id_cliente) values (?, now(), ?, ?, ?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));",
                        [
                            descriptionBalanceCustomers,
                            fecha_vencimiento,
                            "0",
                            total,
                            total,
                            estado,
                            getIdBalanceSupplier,
                            usuario_creador,
                            id_cliente
                        ]
                    );
                }
            }

            res.send("La factura se creo correctamente...");
        } catch (error: any) {            
            res.status(500).json({ error: error.message });
        }
    };
}