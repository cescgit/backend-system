import type { Request, Response } from "express";
import { connection } from "../config/db";
import { purchaseReturnInterface } from "../interface/valueInterface";

export class PurchaseReturnController {
    // * Get all purchase return
    static getAllPurchaseReturn = async (req: Request, res: Response) => {
        try {
            const result = await connection.query(
                "select BIN_TO_UUID(dc.id) as id, dc.numero_compra, dc.numero_factura_proveedor, dc.termino, dc.observaciones, dc.subtotal, dc.total, BIN_TO_UUID(i.id) as id_impuesto, i.abreviatura, i.valor_cantidad, BIN_TO_UUID(pv.id) as id_proveedor, pv.nombre_proveedor as proveedor, BIN_TO_UUID(dc.id_compra) as id_compra, dc.fecha_creacion from devolucion_compra dc inner join proveedor pv on pv.id=dc.id_proveedor inner join impuesto i on i.id=dc.id_impuesto order by dc.numero_compra desc;"
            );
            res.json(result[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    // * Get details purchase return by id
    static getDetailsPurchaseReturnById = async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            const result = await connection.query(
                "select BIN_TO_UUID(ddc.id_producto) as id_producto, p.nombre_producto, p.precio_compra, ddc.cantidad, ddc.subtotal from detalle_devolucion_compra ddc inner join producto p on p.id=ddc.id_producto where BIN_TO_UUID(ddc.id_devolucion_compra) = ?;",
                [id]
            );

            res.json(result[0]);
        } catch (error) {
            res.status(500).json({ error: error.message })
        }
    }

    // *  Create new purcharse return
    static createPurchaseReturn = async (req: Request, res: Response) => {
        const purchaseReturn = <purchaseReturnInterface>req.body;

        const {
            numero_factura_proveedor,
            numero_compra,
            termino,
            observaciones,
            subtotal,
            total,
            id_impuesto,
            id_proveedor,
            usuario_creador,
            detalle_devolucion_compra,
            id_compra
        } = purchaseReturn;

        try {
            const userExists = await connection.query(
                "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
                [usuario_creador]
            );
            const [{ idUser }] = userExists[0];
            if (idUser === 0) {
                const error = new Error("El usuario que esta intentando crear esta devolución de compra no existe en la base de datos...");
                return res.status(409).json({ error: error.message });
            }

            const uuId = await connection.query("select UUID() as getIdBuys;");
            const [{ getIdBuys }] = uuId[0];

            const resultInsertBuys = await connection.query(
                "insert into devolucion_compra (id, numero_factura_proveedor, numero_compra, termino, observaciones, subtotal, total, id_impuesto, id_proveedor, id_compra, fecha_creacion, usuario_creador) values (UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?), now(), UUID_TO_BIN(?));",
                [
                    getIdBuys,
                    numero_factura_proveedor,
                    numero_compra,
                    termino,
                    observaciones,
                    subtotal,
                    total,
                    id_impuesto,
                    id_proveedor,
                    id_compra,
                    usuario_creador
                ]
            );            

            for (const detallesDevolucionCompra of detalle_devolucion_compra) {
                const resultInsertDetailsBuys = await connection.query(
                    "insert into detalle_devolucion_compra (cantidad, subtotal, id_producto, id_devolucion_compra) values (?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?));",
                    [
                        detallesDevolucionCompra.cantidad,
                        detallesDevolucionCompra.subtotal,
                        detallesDevolucionCompra.id_producto,
                        getIdBuys
                    ]
                );                

                await connection.beginTransaction();

                try {
                    const getStockbyInventory = await connection.query(
                        "select dc.cantidad from detalle_compra dc inner join producto p on p.id=dc.id_producto inner join compra c on c.id=dc.id_compra where BIN_TO_UUID(dc.id_compra) = ? and BIN_TO_UUID(dc.id_producto) = ?;",
                        [
                            id_compra,
                            detallesDevolucionCompra.id_producto
                        ]
                    )
                                        
                    if (getStockbyInventory.length > 0) {
                        
                        const getStockbyKardex = await connection.query(
                            "select k.cantidad_disponible, k.total_disponible, k.precio_entrada from kardex k inner join producto p on p.id=k.id_producto where BIN_TO_UUID(k.id_producto) = ? order by k.fecha_creacion desc limit 1;",
                            [detallesDevolucionCompra.id_producto]
                        )
                        const [{ cantidad_disponible, total_disponible }] = getStockbyKardex[0];
                                                
                        const newProductQuantity = cantidad_disponible - detallesDevolucionCompra.cantidad;
                        const newTotalBalance = total_disponible - Number(detallesDevolucionCompra.subtotal);

                        const queryExec = [
                            connection.query(
                                "update inventario set stock = stock - ? where BIN_TO_UUID(id_producto) = ?;",
                                [
                                    detallesDevolucionCompra.cantidad,
                                    detallesDevolucionCompra.id_producto
                                ]
                            ),

                            connection.query(
                                "insert into kardex(descripcion, tipo, cantidad_entrada, precio_entrada, total_entrada, cantidad_salida, precio_salida, total_salida, cantidad_disponible, precio_disponible, total_disponible, fecha_creacion, usuario_creador, id_producto, id_compra) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));",
                                [
                                    purchaseReturn.observaciones, 'Devolución', '0', '0', '0', detallesDevolucionCompra.cantidad, detallesDevolucionCompra.precio_compra, detallesDevolucionCompra.subtotal, newProductQuantity, detallesDevolucionCompra.precio_compra, newTotalBalance, usuario_creador, detallesDevolucionCompra.id_producto, id_compra]
                            ),

                            connection.query(
                                "insert into producto_deteriorado (cantidad, id_producto, usuario_creador)values (?, UUID_TO_BIN(?), UUID_TO_BIN(?));",
                                [detallesDevolucionCompra.cantidad, detallesDevolucionCompra.id_producto, id_compra]
                            )
                        ]

                        await Promise.all(queryExec);

                    } else {
                        res.status(500).json({ error: 'No se encontraron detalles de la devolución de la compra para el producto' });
                    }

                    await connection.commit();
                } catch (err) {
                    await connection.rollback();
                    console.error(err);
                }
            }
            res.send("La devolución de la compra se creo correctamente...");
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
}