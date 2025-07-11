import type { Request, Response } from "express";
import { connection } from "../config/db";
import { salesQuoteInterface } from "../interface/valueInterface";

export class SalesQuoteController {
    // * Get all sales quote
    static getAllSalesQuote = async (req: Request, res: Response) => {
        try {
            const result = await connection.query(
                "select BIN_TO_UUID(cv.id) as id, LPAD(cv.numero_cotizacion, 10, '0') AS numero_cotizacion, cv.termino, cv.observaciones, cv.subtotal, cv.total, cv.dias, cv.fecha_finalizacion, cv.estado, cv.prefacturacion, cv.facturacion, cv.impuesto_manual, BIN_TO_UUID(cl.id) as id_cliente, cl.nombre_cliente as cliente, cv.fecha_creacion, coalesce(uc.nombre_usuario, '') as nombre_usuario_creador, coalesce(um.nombre_usuario, '') as nombre_usuario_modificador from cotizacion_venta cv inner join cliente cl on cl.id=cv.id_cliente left join usuario uc on uc.id=cv.usuario_creador left join usuario um on um.id=cv.usuario_modificador order by cv.numero_cotizacion desc;"
            );
            res.json(result[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    // * Get details sales quote by id
    static getDetailsSalesQuoteById = async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            const result = await connection.query(
                "select BIN_TO_UUID(dcv.id_producto) as id_producto, BIN_TO_UUID(dcv.id_inventario) as id_inventario, p.nombre_producto, p.utilidad1, p.utilidad2, p.utilidad3, p.utilidad4, p.precio1, p.precio2, p.precio3, p.precio4, dcv.cantidad, dcv.precio_venta, dcv.subtotal from detalle_cotizacion_venta dcv inner join producto p on p.id=dcv.id_producto where BIN_TO_UUID(dcv.id_cotizacion_venta) = ?;",
                [id]
            );
            res.json(result[0]);
        } catch (error) {
            res.status(500).json({ error: error.message })
        }
    }

    // *  Create new sales quote
    static createSalesQuote = async (req: Request, res: Response) => {
        const salesQuote = <salesQuoteInterface>req.body;

        const {
            termino,
            observaciones,
            subtotal,
            total,
            dias,
            fecha_finalizacion,
            estado,
            detalle_cotizacion_venta,
            impuesto_manual,
            id_cliente,
            usuario_creador,
        } = salesQuote;

        try {
            const userExists = await connection.query(
                "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
                [usuario_creador]
            );
            const [{ idUser }] = userExists[0];
            if (idUser === 0) {
                const error = new Error("El usuario que esta intentando crear esta cotización no existe en la base de datos...");
                return res.status(409).json({ error: error.message });
            }

            const uuId = await connection.query("select UUID() as getIdSalesQuote;")
            const [{ getIdSalesQuote }] = uuId[0];

            await connection.query(
                "insert into cotizacion_venta (id, termino, observaciones, subtotal, total, dias, fecha_finalizacion, estado, prefacturacion, facturacion, impuesto_manual, id_cliente, usuario_creador, fecha_creacion) values(UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?), now())",
                [
                    getIdSalesQuote,
                    termino,
                    observaciones,
                    subtotal,
                    total,
                    dias,
                    fecha_finalizacion,
                    estado,
                    0,
                    0,
                    JSON.stringify(impuesto_manual),
                    id_cliente,
                    usuario_creador,
                ]
            );

            for (const detallesCotizacionVenta of detalle_cotizacion_venta) {
                await connection.query(
                    "insert into detalle_cotizacion_venta (id_producto, id_inventario, precio_venta, cantidad, subtotal, id_cotizacion_venta) values (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?, UUID_TO_BIN(?));",
                    [
                        detallesCotizacionVenta.id_producto,
                        detallesCotizacionVenta.id_inventario,
                        detallesCotizacionVenta.precio_venta,
                        detallesCotizacionVenta.cantidad,
                        detallesCotizacionVenta.subtotal,
                        getIdSalesQuote
                    ]
                );
            }
            res.send("La cotización se creo correctamente...");
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    // * Update sales quote by id
    static updateSalesQuote = async (req: Request, res: Response) => {
        const { id } = req.params;
        const salesQuote = <salesQuoteInterface>req.body;

        const {
            numero_cotizacion,
            termino,
            observaciones,
            subtotal,
            total,
            dias,
            fecha_finalizacion,
            estado,
            impuesto_manual,
            detalle_cotizacion_venta,
            id_cliente,
            usuario_modificador,
        } = salesQuote;

        await connection.beginTransaction(async (errorMessage: any) => {
            if (errorMessage) {
                return res.status(500).json({ error: errorMessage.message });
            }
        })

        try {
            const userExists = await connection.query(
                "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
                [usuario_modificador]
            );
            const [{ idUser }] = userExists[0];
            if (idUser === 0) {
                const error = new Error("El usuario que esta intentando modificar esta cotización no existe en la base de datos...");
                return res.status(409).json({ error: error.message });
            }

            const salesQuoteExists = await connection.query(
                "select count(numero_cotizacion) as numberSalesQuote from cotizacion_venta where numero_cotizacion = ? and BIN_TO_UUID(id) != ?;",
                [numero_cotizacion, id]
            );
            const [{ numberSalesQuote }] = salesQuoteExists[0];
            if (numberSalesQuote === 1) {
                const error = new Error(
                    "Esta cotización se encuentra registrado en la base de datos..."
                );
                return res.status(409).json({ error: error.message });
            }

            await connection.query(
                "update cotizacion_venta set numero_cotizacion = ?, termino = ?, observaciones = ?, subtotal = ?, total = ?, dias = ?, fecha_finalizacion = ?, estado = ?, impuesto_manual = ?, id_cliente = UUID_TO_BIN(?), usuario_modificador = UUID_TO_BIN(?), fecha_modificacion = now() where id = UUID_TO_BIN(?);",
                [
                    numero_cotizacion,
                    termino,
                    observaciones,
                    subtotal,
                    total,
                    dias,
                    fecha_finalizacion,
                    estado,
                    JSON.stringify(impuesto_manual),
                    id_cliente,
                    usuario_modificador,
                    id
                ]
            );

            const getProductDetailsSalesQuote = await connection.query(
                "select BIN_TO_UUID(id_producto) as id_producto from detalle_cotizacion_venta where id_cotizacion_venta = UUID_TO_BIN(?);",
                [id]
            );                      

            for (const idProductDelete of getProductDetailsSalesQuote[0]) {                
                await connection.query(
                    "delete from detalle_cotizacion_venta where id_cotizacion_venta = UUID_TO_BIN(?) and id_producto = UUID_TO_BIN(?);",
                    [id, idProductDelete.id_producto]
                );
            }

            for (const detallesCotizacionVenta of detalle_cotizacion_venta) {
                try {
                    const getAmountByProductInventoryResults = await connection.query(
                        "select stock from inventario where BIN_TO_UUID(id_producto) = ?;",
                        [detallesCotizacionVenta.id_producto]
                    );

                    const [{ stock }] = getAmountByProductInventoryResults[0];

                    if (detallesCotizacionVenta.cantidad > stock) {
                        const error = new Error("No se pueden agregar más cantidad de este producto, ya que no dispones en tu inventario...");
                        return res.status(404).json({ error: error.message });
                    }

                    await connection.query(
                        "insert into detalle_cotizacion_venta (id_producto, id_inventario, precio_venta, cantidad, subtotal, id_cotizacion_venta) values (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?, UUID_TO_BIN(?));",
                        [
                            detallesCotizacionVenta.id_producto,
                            detallesCotizacionVenta.id_inventario,
                            detallesCotizacionVenta.precio_venta,
                            detallesCotizacionVenta.cantidad,
                            detallesCotizacionVenta.subtotal,
                            id
                        ]
                    );

                } catch (error) {                    
                    return res.status(404).json({ error: error.message });
                }
            }

            res.send("La cotización se modifico correctamente...");
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    // * Cancel sales quote by id
    static cancelSalesQuote = async (req: Request, res: Response) => {
        const { idSalesQuote } = req.params;
        try {
            const existsSalesQuote = await connection.query(
                "select count(BIN_TO_UUID(id)) as id from cotizacion_venta where BIN_TO_UUID(id) = ?;",
                [idSalesQuote]
            );
            const [{ id }] = existsSalesQuote[0];

            if (id === 0) {
                const error = new Error(
                    "La cotización que estas buscando, no se encontro..."
                );
                return res.status(404).json({ error: error.message });
            }

            await connection.query(
                "update cotizacion_venta set estado = 0 where BIN_TO_UUID(id) = ?;",
                [idSalesQuote]
            );

            res.send("La cotización se anulo correctamente...");
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    // * Reactivate sales quote by id
    static reactivateSalesQuote = async (req: Request, res: Response) => {
        const { idSalesQuote } = req.params;
        try {
            const existsSalesQuote = await connection.query(
                "select count(BIN_TO_UUID(id)) as id from cotizacion_venta where BIN_TO_UUID(id) = ?;",
                [idSalesQuote]
            );
            const [{ id }] = existsSalesQuote[0];

            if (id === 0) {
                const error = new Error(
                    "La cotización que estas buscando, no se encontro..."
                );
                return res.status(404).json({ error: error.message });
            }

            await connection.query(
                "update cotizacion_venta set estado = 1 where BIN_TO_UUID(id) = ?;",
                [idSalesQuote]
            );

            res.send("La cotización se reactivo correctamente...");
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
}