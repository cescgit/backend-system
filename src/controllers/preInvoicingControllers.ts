import type { Request, Response } from "express";
import { connection } from "../config/db";
import type {
    preInvoicingInterface
} from "../interface/valueInterface";

export class PreInvoicingControllers {
    // * Get alls pre-invoicing
    static getAllPreInvoicing = async (req: Request, res: Response) => {
        try {
            const result = await connection.query(
                "select BIN_TO_UUID(p.id) as id, LPAD(p.numero_prefacturacion, 10, '0') AS numero_prefacturacion, p.termino, p.observaciones, p.subtotal, p.total, p.estado, p.impuesto_manual, p.fecha_creacion, p.cuenta_por_cobrar, p.cliente_existente, p.cliente_manual, BIN_TO_UUID(p.id_cliente) as id_cliente, c.nombre_cliente as cliente, coalesce(uc.nombre_usuario, '') as nombre_usuario_creador from prefacturacion p left join cliente c on c.id=p.id_cliente left join usuario uc on uc.id=p.usuario_creador order by p.numero_prefacturacion desc;"
            );
            res.json(result[0]);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    // * Get pre-invoincing by id
    static getPreInvoicingById = async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            const result = await connection.query(
                "select BIN_TO_UUID(dp.id) as id, dp.precio_venta, dp.cantidad, dp.subtotal, BIN_TO_UUID(dp.id_producto) as id_producto, BIN_TO_UUID(dp.id_prefacturacion) as id_prefacturacion, p.nombre_producto from detalle_prefacturacion dp inner join producto p on p.id=dp.id_producto where dp.id_prefacturacion = UUID_TO_BIN(?);",
                [id]
            );

            res.json(result[0]);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    // *  Create new pre-invoicing
    static createPreInvoicing = async (req: Request, res: Response) => {
        const preInvoincing = <preInvoicingInterface>req.body;

        const {
            termino,
            observaciones,
            subtotal,
            total,
            estado,
            impuesto_manual,
            cuenta_por_cobrar,
            cliente_existente,
            cliente_manual,
            detalles_prefacturacion,
            fecha_vencimiento,
            id_cliente,
            usuario_creador
        } = preInvoincing;

        try {
            // * query to check if the user exists in the database
            const userExists = await connection.query(
                "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
                [usuario_creador]
            );
            const [{ idUser }] = (userExists as any)[0];
            if (idUser === 0) {
                const error = new Error("El usuario que esta intentando crear esta prefacturación no existe en la base de datos...");
                return res.status(409).json({ error: error.message });
            }

            const uuId = await connection.query("select UUID() as getIdPreInvoicing;")
            const [{ getIdPreInvoicing }] = (uuId as any)[0];            

            if (cliente_existente == 1) {
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
                await connection.query(
                    "insert into prefacturacion (id, termino, observaciones, subtotal, total, estado, impuesto_manual, fecha_creacion, cuenta_por_cobrar, cliente_existente, id_cliente, usuario_creador) values (UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?, now(), ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?));",
                    [
                        getIdPreInvoicing,
                        termino,
                        observaciones,
                        subtotal,
                        total,
                        estado,
                        JSON.stringify(impuesto_manual),
                        cuenta_por_cobrar,
                        cliente_existente,
                        id_cliente,
                        usuario_creador
                    ]
                );
            }
            else {
                await connection.query(
                    "insert into prefacturacion (id, termino, observaciones, subtotal, total, estado, impuesto_manual, fecha_creacion, cuenta_por_cobrar, cliente_existente, cliente_manual, usuario_creador) values (UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?, now(), ?, ?, ?, UUID_TO_BIN(?));",
                    [
                        getIdPreInvoicing,
                        termino,
                        observaciones,
                        subtotal,
                        total,
                        estado,
                        JSON.stringify(impuesto_manual),
                        cuenta_por_cobrar,
                        cliente_existente,
                        JSON.stringify(cliente_manual),
                        usuario_creador
                    ]
                );
            }

            for (const detallesPrefacturacion of detalles_prefacturacion) {

                const productExists = await connection.query(
                    "select count(BIN_TO_UUID(id)) as idProduct from producto where BIN_TO_UUID(id) = ?;",
                    [detallesPrefacturacion.id_producto]
                );
                const [{ idProduct }] = (productExists as any)[0];
                if (idProduct === 0) {
                    const error = new Error("El producto que esta buscando no existe en la base de datos...");
                    return res.status(409).json({ error: error.message });
                }

                await connection.query(
                    "insert into detalle_prefacturacion (cantidad, precio_venta, subtotal, id_producto, id_inventario, id_prefacturacion) values (?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));",
                    [
                        detallesPrefacturacion.cantidad,
                        detallesPrefacturacion.precio_venta,
                        detallesPrefacturacion.subtotal,
                        detallesPrefacturacion.id_producto,
                        detallesPrefacturacion.id_inventario,
                        getIdPreInvoicing
                    ]
                );

                const getStockbyKardex = await connection.query(
                    "select k.fecha_creacion, k.precio_disponible, k.cantidad_disponible, k.total_disponible from kardex k inner join  producto p on p.id=k.id_producto where BIN_TO_UUID(k.id_producto) = ? order by k.fecha_creacion desc;",
                    [detallesPrefacturacion.id_producto]
                )
                const [{ precio_disponible, cantidad_disponible, total_disponible }] = (getStockbyKardex as any)[0];

                const resultCantidadNew = cantidad_disponible - detallesPrefacturacion.cantidad;                
                const resultTotal = parseInt(total_disponible) - parseInt(detallesPrefacturacion.subtotal.toString());
                const resultNewPricing = resultTotal / resultCantidadNew;                

                const getEarningProductById = await connection.query(
                    "select utilidad1, utilidad2, utilidad3, utilidad4 from producto where BIN_TO_UUID(id) = ?;",
                    [detallesPrefacturacion.id_producto]
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
                        detallesPrefacturacion.id_producto
                    ]
                );

                await connection.query(
                    "insert into kardex(descripcion, tipo, cantidad_entrada, precio_entrada, total_entrada, cantidad_salida, precio_salida, total_salida, precio_facturacion, cantidad_disponible, precio_disponible, total_disponible, fecha_creacion, usuario_creador, id_producto, id_venta) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));",
                    [
                        preInvoincing.observaciones,
                        'Prefacturación',
                        "0",
                        "0",
                        "0",
                        detallesPrefacturacion.cantidad,
                        precio_disponible,
                        detallesPrefacturacion.subtotal,
                        detallesPrefacturacion.precio_venta,
                        resultCantidadNew,
                        resultNewPricing,
                        resultTotal,
                        usuario_creador,
                        detallesPrefacturacion.id_producto,
                        getIdPreInvoicing
                    ]
                );

                await connection.query(
                    "update inventario set stock = stock - ? where BIN_TO_UUID(id_producto) = ?;",
                    [
                        detallesPrefacturacion.cantidad,
                        detallesPrefacturacion.id_producto
                    ]
                );
            }

            if (cuenta_por_cobrar == true) {
                // * query to check if the customer balance exists in the database
                const customerExistsInBalance = await connection.query(
                    "select count(BIN_TO_UUID(id_cliente)) as customerExistsBalance from balance_cliente where BIN_TO_UUID(id_cliente) = ?;",
                    [id_cliente]
                );
                const [{ customerExistsBalance }] = (customerExistsInBalance as any)[0];

                if (customerExistsBalance >= 1) {
                    // * get the debit, credit and balance of the customer
                    const resultDataBalanceCustomer = await connection.query(
                        "select debito as totalDebito, credito as totalCredito, balance as totalBalance, BIN_TO_UUID(id_cliente) as idCustomer from balance_cliente where BIN_TO_UUID(id_cliente) = ?;",
                        [id_cliente]
                    );

                    const [{
                        totalDebito,
                        totalcredito,
                        totalBalance
                    }] = (resultDataBalanceCustomer[0] as any[]);

                    // * get number of sales
                    const resultNumberPreInvoincing = await connection.query(
                        "select LPAD(numero_prefacturacion, 10, '0') AS numberPreInvoincing from venta order by numero_venta desc limit 1;"
                    );

                    const [{ numberPreInvoincing }] = (resultNumberPreInvoincing[0] as any[]);
                    const descriptionBalanceCustomer = `Prefacturación N° ${numberPreInvoincing}`;

                    // * create operation balance customer
                    const totalBalanceCustomer = totalBalance - parseInt(total.toString());

                    const uuIdBalanceCustomer = await connection.query("select UUID() as getIdBalanceCustomer;")
                    const [{ getIdBalanceCustomer }] = (uuIdBalanceCustomer[0] as any[]);

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

                    const resultNumberPreInvoicing = await connection.query(
                        "select LPAD(numero_prefacturacion, 10, '0') AS numberPreInvoicing from prefacturacion order by numero_prefacturacion desc limit 1;"
                    );

                    // * get number of pre-invoicing
                    const [{ numberPreInvoicing }] = (resultNumberPreInvoicing as any)[0];
                    const descriptionBalanceCustomers = `Prefactura N° ${numberPreInvoicing}`;

                    const uuIdBalanceCustomer = await connection.query("select UUID() as getIdBalanceSupplier;")
                    const [{ getIdBalanceSupplier }] = (uuIdBalanceCustomer[0] as any[]);

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
                            getIdPreInvoicing,
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
            res.send("La prefacturación se creo correctamente...");
        } catch (error: any) {            
            res.status(500).json({ error: error.message });
        }
    };

    // *  Create a sale from a sales quote
    static createPreInvoicingFromSalesQuote = async (req: Request, res: Response) => {
        const { idSalesQuote } = req.params;
        const preInvoicing = <preInvoicingInterface>req.body;

        const {
            termino,
            observaciones,
            subtotal,
            total,
            estado,
            impuesto_manual,
            cuenta_por_cobrar,
            cliente_existente,
            cliente_manual,
            detalles_prefacturacion,
            fecha_vencimiento,
            id_cliente,
            usuario_creador
        } = preInvoicing;

        try {
            // * query to check if the user exists in the database
            const userExists = await connection.query(
                "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
                [usuario_creador]
            );
            const [{ idUser }] = (userExists as any)[0];
            if (idUser === 0) {
                const error = new Error("El usuario que esta intentando crear esta prefacturación no existe en la base de datos...");
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

            const uuId = await connection.query("select UUID() as getIdPreInvoicing;")
            const [{ getIdPreInvoicing }] = (uuId as any)[0];

            if (cliente_existente == 1) {
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

                await connection.query(
                    "insert into prefacturacion (id, termino, observaciones, subtotal, total, estado, impuesto_manual, fecha_creacion, cuenta_por_cobrar, cliente_existente, id_cliente, usuario_creador) values (UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?, now(), ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?));",
                    [
                        getIdPreInvoicing,
                        termino,
                        observaciones,
                        subtotal,
                        total,
                        estado,
                        JSON.stringify(impuesto_manual),
                        cuenta_por_cobrar,
                        cliente_existente,
                        id_cliente,
                        usuario_creador
                    ]
                );
            }
            else {
                await connection.query(
                    "insert into prefacturacion (id, termino, observaciones, subtotal, total, estado, impuesto_manual, fecha_creacion, cuenta_por_cobrar, cliente_existente, cliente_manual, usuario_creador) values (UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?, now(), ?, ?, ?, UUID_TO_BIN(?));",
                    [
                        getIdPreInvoicing,
                        termino,
                        observaciones,
                        subtotal,
                        total,
                        estado,
                        JSON.stringify(impuesto_manual),
                        cuenta_por_cobrar,
                        cliente_existente,
                        JSON.stringify(cliente_manual),
                        usuario_creador
                    ]
                );
            }

            await connection.query(
                "update cotizacion_venta set prefacturacion = 1 where id = UUID_TO_BIN(?);",
                [idSalesQuote]
            );

            for (const detallesPreFacturacion of detalles_prefacturacion) {
                const productExists = await connection.query(
                    "select count(BIN_TO_UUID(id)) as idProduct from producto where BIN_TO_UUID(id) = ?;",
                    [detallesPreFacturacion.id_producto]
                );
                const [{ idProduct }] = (productExists as any)[0];
                if (idProduct === 0) {
                    const error = new Error("El producto que esta buscando no existe en la base de datos...");
                    return res.status(409).json({ error: error.message });
                }

                await connection.query(
                    "insert into detalle_prefacturacion (cantidad, precio_venta, subtotal, id_producto, id_prefacturacion) values (?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?));",
                    [
                        detallesPreFacturacion.cantidad,
                        detallesPreFacturacion.precio_venta,
                        detallesPreFacturacion.subtotal,
                        detallesPreFacturacion.id_producto,
                        getIdPreInvoicing
                    ]
                );

                const getStockbyKardex = await connection.query(
                    "select k.fecha_creacion, k.precio_disponible, k.cantidad_disponible, k.total_disponible from kardex k inner join  producto p on p.id=k.id_producto where BIN_TO_UUID(k.id_producto) = ? order by k.fecha_creacion desc;",
                    [detallesPreFacturacion.id_producto]
                )
                const [{ precio_disponible, cantidad_disponible, total_disponible }] = (getStockbyKardex as any)[0];

                const resultCantidadNew = cantidad_disponible - detallesPreFacturacion.cantidad;                
                const resultTotal = parseInt(total_disponible) - parseInt(detallesPreFacturacion.subtotal.toString());
                const resultNewPricing = resultTotal / resultCantidadNew;                

                const getEarningProductById = await connection.query(
                    "select utilidad1, utilidad2, utilidad3, utilidad4 from producto where BIN_TO_UUID(id) = ?;",
                    [detallesPreFacturacion.id_producto]
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
                        detallesPreFacturacion.id_producto
                    ]
                );

                await connection.query(
                    "insert into kardex(descripcion, tipo, cantidad_entrada, precio_entrada, total_entrada, cantidad_salida, precio_salida, total_salida, precio_facturacion, cantidad_disponible, precio_disponible, total_disponible, fecha_creacion, usuario_creador, id_producto, id_venta) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));",
                    [
                        preInvoicing.observaciones,
                        'Prefacturación',
                        "0",
                        "0",
                        "0",
                        detallesPreFacturacion.cantidad,
                        precio_disponible,
                        detallesPreFacturacion.subtotal,
                        detallesPreFacturacion.precio_venta,
                        resultCantidadNew,
                        resultNewPricing,
                        resultTotal,
                        usuario_creador,
                        detallesPreFacturacion.id_producto,
                        getIdPreInvoicing
                    ]
                );

                await connection.query(
                    "update inventario set stock = stock - ? where BIN_TO_UUID(id_producto) = ?;",
                    [
                        detallesPreFacturacion.cantidad,
                        detallesPreFacturacion.id_producto
                    ]
                );
            }

            if (cuenta_por_cobrar == true && cliente_existente == 0) {
                // * query to check if the customer balance exists in the database
                const customerExistsInBalance = await connection.query(
                    "select count(BIN_TO_UUID(id_cliente)) as customerExistsBalance from balance_cliente where BIN_TO_UUID(id_cliente) = ?;",
                    [id_cliente]
                );
                const [{ customerExistsBalance }] = (customerExistsInBalance as any)[0];

                if (customerExistsBalance >= 1) {
                    // * get the debit, credit and balance of the customer
                    const resultDataBalanceCustomer = await connection.query(
                        "select debito as totalDebito, credito as totalCredito, balance as totalBalance, BIN_TO_UUID(id_cliente) as idCustomer from balance_cliente where BIN_TO_UUID(id_cliente) = ?;",
                        [id_cliente]
                    );

                    const [{
                        totalDebito,
                        totalcredito,
                        totalBalance
                    }] = (resultDataBalanceCustomer[0] as any[]);

                    // * get number of sales
                    const resultNumberPreInvoicing = await connection.query(
                        "select LPAD(numero_prefacturacion, 10, '0') AS numberPreInvoicing from prefacturacion order by numero_prefacturacion desc limit 1;"
                    );

                    const [{ numberPreInvoicing }] = (resultNumberPreInvoicing[0] as any[]);
                    const descriptionBalanceCustomer = `Prefacturación N° ${numberPreInvoicing}`;

                    // * create operation balance customer
                    const totalBalanceCustomer = totalBalance - parseInt(total.toString());

                    const uuIdBalanceCustomer = await connection.query("select UUID() as getIdBalanceCustomer;")
                    const [{ getIdBalanceCustomer }] = (uuIdBalanceCustomer[0] as any[]);

                    await connection.query(
                        "insert into balance_cliente(id, descripcion, fecha_emision, fecha_vencimiento, debito, credito, balance, estado, estado_credito, id_prefacturacion, usuario_creador, id_cliente) values (UUID_TO_BIN(?), ?, now(), ?, ?, ?, ?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));",
                        [
                            getIdBalanceCustomer,
                            descriptionBalanceCustomer,
                            fecha_vencimiento,
                            "0",
                            total,
                            totalBalanceCustomer,
                            estado,
                            0,
                            numberPreInvoicing,
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

                    const resultNumberPreInvoicing = await connection.query(
                        "select LPAD(numero_prefacturacion, 10, '0') AS numberPreInvoicing from venta order by numero_prefacturacion desc limit 1;"
                    );

                    // * get number of pre-invoicing
                    const [{ numberPreInvoicing }] = (resultNumberPreInvoicing[0] as any[]);
                    const descriptionBalanceCustomers = `Prefactura N° ${numberPreInvoicing}`;

                    const uuIdBalanceCustomer = await connection.query("select UUID() as getIdBalanceCustomer;")
                    const [{ getIdBalanceCustomer }] = (uuIdBalanceCustomer[0] as any[]);

                    // * insert data in the first register of balance customer
                    await connection.query(
                        "insert into balance_cliente(id, descripcion, fecha_emision, fecha_vencimiento, debito, credito, balance, estado, estado_credito, id_prefacturacion, usuario_creador, id_cliente) values (UUID_TO_BIN(?), ?, now(), ?, ?, ?, ?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));",
                        [
                            getIdBalanceCustomer,
                            descriptionBalanceCustomers,
                            fecha_vencimiento,
                            "0",
                            total,
                            total,
                            estado,
                            0,
                            numberPreInvoicing,
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
                            getIdBalanceCustomer,
                            usuario_creador,
                            id_cliente
                        ]
                    );
                }
            }

            res.send("La prefacturación se creo correctamente...");
        } catch (error: any) {            
            res.status(500).json({ error: error.message });
        }
    };

    // *  Create a sale from a separated product
    static createPreInvoicingFromSeparatedProduct = async (req: Request, res: Response) => {
        const { idSeparatedProduct } = req.params;
        const preInvoicing = <preInvoicingInterface>req.body;

        const {
            termino,
            observaciones,
            subtotal,
            total,
            cuenta_por_cobrar,
            impuesto_manual,
            fecha_vencimiento,
            cliente_existente,
            cliente_manual,
            id_cliente,
            usuario_creador,
            estado,
            detalles_prefacturacion
        } = preInvoicing;

        try {
            // * query to check if the user exists in the database
            const userExists = await connection.query(
                "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
                [usuario_creador]
            );
            const [{ idUser }] = (userExists as any)[0];
            if (idUser === 0) {
                const error = new Error("El usuario que esta intentando crear esta prefacturación no existe en la base de datos...");
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

            const uuId = await connection.query("select UUID() as getIdPreInvoicing;")
            const [{ getIdPreInvoicing }] = (uuId as any)[0];

            if (cliente_existente == 1) {
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

                await connection.query(
                    "insert into prefacturacion (id, termino, observaciones, subtotal, total, estado, impuesto_manual, fecha_creacion, cuenta_por_cobrar, cliente_existente, id_cliente, usuario_creador) values (UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?, now(), ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?));",
                    [
                        getIdPreInvoicing,
                        termino,
                        observaciones,
                        subtotal,
                        total,
                        estado,
                        JSON.stringify(impuesto_manual),
                        cuenta_por_cobrar,
                        cliente_existente,
                        id_cliente,
                        usuario_creador
                    ]
                );
            }
            else {
                await connection.query(
                    "insert into prefacturacion (id, termino, observaciones, subtotal, total, estado, impuesto_manual, fecha_creacion, cuenta_por_cobrar, cliente_existente, cliente_manual, usuario_creador) values (UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?, now(), ?, ?, ?, UUID_TO_BIN(?));",
                    [
                        getIdPreInvoicing,
                        termino,
                        observaciones,
                        subtotal,
                        total,
                        estado,
                        JSON.stringify(impuesto_manual),
                        cuenta_por_cobrar,
                        cliente_existente,
                        JSON.stringify(cliente_manual),
                        usuario_creador
                    ]
                );
            }

            await connection.query(
                "update producto_apartado set prefacturacion = 1 where id = UUID_TO_BIN(?);",
                [idSeparatedProduct]
            );

            for (const detallesPrefacturacion of detalles_prefacturacion) {
                const productExists = await connection.query(
                    "select count(BIN_TO_UUID(id)) as idProduct from producto where BIN_TO_UUID(id) = ?;",
                    [detallesPrefacturacion.id_producto]
                );
                const [{ idProduct }] = (productExists as any)[0];
                if (idProduct === 0) {
                    const error = new Error("El producto que esta buscando no existe en la base de datos...");
                    return res.status(409).json({ error: error.message });
                }

                await connection.query(
                    "insert into detalle_prefacturacion (cantidad, precio_venta, subtotal, id_producto, id_inventario, id_prefacturacion) values (?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));",
                    [
                        detallesPrefacturacion.cantidad,
                        detallesPrefacturacion.precio_venta,
                        detallesPrefacturacion.subtotal,
                        detallesPrefacturacion.id_producto,
                        detallesPrefacturacion.id_inventario,
                        getIdPreInvoicing
                    ]
                );

                const getStockbyKardex = await connection.query(
                    "select k.fecha_creacion, k.cantidad_disponible, k.total_disponible from kardex k inner join  producto p on p.id=k.id_producto where BIN_TO_UUID(k.id_producto) = ? order by k.fecha_creacion desc;",
                    [detallesPrefacturacion.id_producto]
                )
                const [{ cantidad_disponible, total_disponible }] = (getStockbyKardex as any)[0];

                const resultCantidadNew = cantidad_disponible - detallesPrefacturacion.cantidad;
                const resultTotal = parseInt(total_disponible) - parseInt(detallesPrefacturacion.subtotal.toString());

                connection.query(
                    "insert into kardex(descripcion, tipo, cantidad_entrada, precio_entrada, total_entrada, cantidad_salida, precio_salida, precio_facturacion, total_salida, cantidad_disponible, precio_disponible, total_disponible, fecha_creacion, usuario_creador, id_producto, id_compra) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));",
                    [
                        preInvoicing.observaciones,
                        'Prefacturación',
                        "0",
                        "0",
                        "0",
                        detallesPrefacturacion.cantidad,
                        detallesPrefacturacion.precio_venta,
                        detallesPrefacturacion.subtotal,
                        resultCantidadNew,
                        detallesPrefacturacion.precio_venta,
                        detallesPrefacturacion.precio_venta,
                        resultTotal,
                        usuario_creador,
                        detallesPrefacturacion.id_producto,
                        getIdPreInvoicing
                    ]
                );

                await connection.query(
                    "update inventario set stock = stock - ? where BIN_TO_UUID(id_producto) = ?;",
                    [
                        detallesPrefacturacion.cantidad,
                        detallesPrefacturacion.id_producto
                    ]
                );
            }

            if (cuenta_por_cobrar == true) {
                // * query to check if the customer balance exists in the database
                const customerExistsInBalance = await connection.query(
                    "select count(BIN_TO_UUID(id_cliente)) as customerExistsBalance from balance_cliente where BIN_TO_UUID(id_cliente) = ?;",
                    [id_cliente]
                );
                const [{ customerExistsBalance }] = (customerExistsInBalance as any)[0];

                if (customerExistsBalance >= 1) {
                    // * get the debit, credit and balance of the customer
                    const resultDataBalanceCustomer = await connection.query(
                        "select debito as totalDebito, credito as totalCredito, balance as totalBalance, BIN_TO_UUID(id_cliente) as idCustomer from balance_cliente where BIN_TO_UUID(id_cliente) = ?;",
                        [id_cliente]
                    );

                    const [{
                        totalDebito,
                        totalcredito,
                        totalBalance
                    }] = (resultDataBalanceCustomer[0] as any[]);

                    // * get number of sales
                    const resultNumberPreInvoicing = await connection.query(
                        "select LPAD(numero_prefacturacion, 10, '0') AS numberPreInvoicing from prefacturacion order by numero_prefacturacion desc limit 1;"
                    );

                    const [{ numberPreInvoicing }] = (resultNumberPreInvoicing[0] as any[]);
                    const descriptionBalanceCustomer = `Prefacturación N° ${numberPreInvoicing}`;

                    // * create operation balance customer
                    const totalBalanceCustomer = totalBalance - parseInt(total.toString());

                    const uuIdBalanceCustomer = await connection.query("select UUID() as getIdBalanceCustomer;")
                    const [{ getIdBalanceCustomer }] = (uuIdBalanceCustomer[0] as any[]);

                    await connection.query(
                        "insert into balance_cliente(id, descripcion, fecha_emision, fecha_vencimiento, debito, credito, balance, estado, estado_credito, id_prefacturacion, usuario_creador, id_cliente) values (UUID_TO_BIN(?), ?, now(), ?, ?, ?, ?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));",
                        [
                            getIdBalanceCustomer,
                            descriptionBalanceCustomer,
                            fecha_vencimiento,
                            "0",
                            total,
                            totalBalanceCustomer,
                            estado,
                            0,
                            numberPreInvoicing,
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

                    const resultNumberPreInvoicing = await connection.query(
                        "select LPAD(numero_prefacturacion, 10, '0') AS numberPreInvoicing from venta order by numero_prefacturacion desc limit 1;"
                    );

                    // * get number of pre-invoicing
                    const [{ numberPreInvoicing }] = (resultNumberPreInvoicing[0] as any[]);
                    const descriptionBalanceCustomers = `Prefacturación N° ${numberPreInvoicing}`;

                    const uuIdBalanceCustomer = await connection.query("select UUID() as getIdBalanceSupplier;")
                    const [{ getIdBalanceSupplier }] = (uuIdBalanceCustomer[0] as any[]);

                    // * insert data in the first register of balance customer
                    await connection.query(
                        "insert into balance_cliente(id, descripcion, fecha_emision, fecha_vencimiento, debito, credito, balance, estado, estado_credito, id_prefacturacion, usuario_creador, id_cliente) values (UUID_TO_BIN(?), ?, now(), ?, ?, ?, ?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));",
                        [
                            getIdBalanceSupplier,
                            descriptionBalanceCustomers,
                            fecha_vencimiento,
                            "0",
                            total,
                            total,
                            estado,
                            0,
                            numberPreInvoicing,
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

            res.send("La prefacturación se creo correctamente...");
        } catch (error: any) {            
            res.status(500).json({ error: error.message });
        }
    };
}
