import type { Request, Response } from "express";
import { connection } from "../config/db";
import type {
    remissionInterface
} from "../interface/valueInterface";
import { ADDRGETNETWORKPARAMS } from "node:dns";

export class RemissionController {
    // * Get alls Remissions
    static getAllRemissions = async (req: Request, res: Response) => {
        try {
            const result = await connection.query(
                "select BIN_TO_UUID(r.id) as id, LPAD(r.codigo, 10, '0') as codigo, BIN_TO_UUID(c.id) as id_cliente, c.nombre_cliente, r.fecha_creacion, coalesce(uc.nombre_usuario, '') as nombre_usuario_creador, coalesce(um.nombre_usuario, '') as nombre_usuario_modificador from remisiones r inner join cliente c on c.id=r.id_cliente left join usuario uc on uc.id=r.usuario_creador left join usuario um on um.id=r.usuario_modificador;"
            );
            res.json(result[0]);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    // * Get remission by id
    static getRemissionById = async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            const result = await connection.query(
                "select BIN_TO_UUID(dr.id_producto) as id_producto, BIN_TO_UUID(dr.id_inventario) as id_inventario, p.nombre_producto, dr.cantidad  from remisiones r inner join detalle_remisiones dr on r.id=dr.id_remisiones  inner join producto p on p.id=dr.id_producto inner join inventario i on i.id=dr.id_inventario where BIN_TO_UUID(id_remisiones) = ?;",
                [id]
            );

            res.json(result[0]);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    // *  Create new remission
    static createRemission = async (req: Request, res: Response) => {
        const remission = <remissionInterface>req.body;

        const {
            detalle_remision,
            id_cliente,
            usuario_creador,
        } = remission;

        try {
            const userExists = await connection.query(
                "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
                [usuario_creador]
            );
            const [{ idUser }] = (userExists as any)[0];
            if (idUser === 0) {
                const error = new Error("El usuario que esta creando esta remisión, no existe...");
                return res.status(409).json({ error: error.message });
            }

            const uuId = await connection.query("select UUID() as getIdRemission;")
            const [{ getIdRemission }] = (uuId as any)[0];

            await connection.query(
                "insert into remisiones (id, fecha_creacion, id_cliente, usuario_creador) values (UUID_TO_BIN(?), now(), UUID_TO_BIN(?), UUID_TO_BIN(?));",
                [getIdRemission, id_cliente, usuario_creador]
            );

            for (const detallesRemissions of detalle_remision) {
                const getDataProducts = await connection.query(
                    "select stock, coalesce(cantidad_remision, '0') as cantidad_remision from inventario where id_producto = UUID_TO_BIN(?);",
                    [detallesRemissions.id_producto]
                )
                const [{ stock, cantidad_remision }] = (getDataProducts as any)[0];
                const newStockInvetory = stock - detallesRemissions.cantidad;

                if (newStockInvetory < 0) {
                    return res.status(409).json({ error: "No hay suficiente stock para crear la remisión..." });
                }
                else {

                    if (cantidad_remision > 0) {
                        const resultNewAmmountDetailsRemissions = parseInt(cantidad_remision) + detallesRemissions.cantidad;
                        await connection.query(
                            "update inventario set stock = ?, cantidad_remision = ? where id_producto = UUID_TO_BIN(?);",
                            [newStockInvetory, resultNewAmmountDetailsRemissions, detallesRemissions.id_producto]
                        );

                        await connection.query(
                            "insert into detalle_remisiones (cantidad, id_producto, id_inventario, id_remisiones) values (?, UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));",
                            [detallesRemissions.cantidad, detallesRemissions.id_producto, detallesRemissions.id_inventario, getIdRemission]
                        );
                    }
                    else {

                        await connection.query(
                            "update inventario set stock = ?, cantidad_remision = ? where id_producto = UUID_TO_BIN(?);",
                            [newStockInvetory, detallesRemissions.cantidad, detallesRemissions.id_producto]
                        )

                        await connection.query(
                            "insert into detalle_remisiones (cantidad, id_producto, id_inventario, id_remisiones) values (?, UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));",
                            [detallesRemissions.cantidad, detallesRemissions.id_producto, detallesRemissions.id_inventario, getIdRemission]
                        );
                    }
                }
            }
            res.send("Remisión creada correctamente...");
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    // * Update remission by id
    static updateRemission = async (req: Request, res: Response) => {
        const { id } = req.params;
        const remission = <remissionInterface>req.body;
        const {
            detalle_remision,
            id_cliente,
            usuario_modificador,
        } = remission;


        try {
            const userExists = await connection.query(
                "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
                [usuario_modificador]
            );
            const [{ idUser }] = (userExists as any)[0];
            if (idUser === 0) {
                const error = new Error("El usuario que esta editando esta remisión no existe...");
                return res.status(409).json({ error: error.message });
            }

            const existsRemisssion = await connection.query(
                "select count(BIN_TO_UUID(id)) as countRemission from remisiones where BIN_TO_UUID(id) = ?;",
                [id]
            )

            const [{ countRemission }] = (existsRemisssion as any) [0];

            if (countRemission === 0) {
                return res.status(404).json({ error: "La remisión que estas buscando no existe..." });
            }

            for (const detallesRemissions of detalle_remision) {


                const existsProductInventory = await connection.query(
                    "select count(cantidad) as existsRemissions from detalle_remisiones where id_producto = UUID_TO_BIN(?);",
                    [detallesRemissions.id_producto]
                );
                const [{ existsRemissions }] = (existsProductInventory as any)[0];                

                if (existsRemissions > 0) {

                    const getDataStockProduct = await connection.query(
                        "select stock as stockInventory from inventario where id_producto = UUID_TO_BIN(?);",
                        [detallesRemissions.id_producto]
                    )
                    const [{ stockInventory }] = (getDataStockProduct as any)[0];

                    const getAmmount = await connection.query(
                        "select cantidad as Ammount from detalle_remisiones where id_producto = UUID_TO_BIN(?);",
                        [detallesRemissions.id_producto]
                    )
                    const [{ Ammount }] = (getAmmount as any)[0];                    

                    const sumStockInventory = stockInventory + Ammount;

                    await connection.query(
                        "update inventario set stock = ? where id_producto = UUID_TO_BIN(?);",
                        [sumStockInventory, detallesRemissions.id_producto]
                    );

                    const getDataProducts = await connection.query(
                        "select stock from inventario where id_producto = UUID_TO_BIN(?);",
                        [detallesRemissions.id_producto]
                    )
                    const [{ stock }] = (getDataProducts as any)[0];

                    const newStockInvetory = stock - detallesRemissions.cantidad;
                    if (newStockInvetory <= 0) {
                        return res.status(409).json({ error: "No hay suficiente stock para crear la remisión..." });
                    }
                    else {
                        await connection.query(
                            "update inventario set stock = ?, cantidad_remision = ? where id_producto = UUID_TO_BIN(?);",
                            [newStockInvetory, detallesRemissions.cantidad, detallesRemissions.id_producto]
                        )
                    }
                }
                else {

                    const getDataProducts = await connection.query(
                        "select stock from inventario where id_producto = UUID_TO_BIN(?);",
                        [detallesRemissions.id_producto]
                    )
                    const [{ stock }] = (getDataProducts as any)[0];

                    const newStockInvetory = stock - detallesRemissions.cantidad;

                    if (newStockInvetory <= 0) {
                        return res.status(409).json({ error: "No hay suficiente stock para crear la remisión..." });
                    }
                    else {
                        await connection.query(
                            "update inventario set stock = ?, cantidad_remision = ? where id_producto = UUID_TO_BIN(?);",
                            [newStockInvetory, detallesRemissions.cantidad, detallesRemissions.id_producto]
                        )

                        await connection.query(
                            "insert into detalle_remisiones (cantidad, id_producto, id_inventario, id_remisiones) values (?, UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?))",
                            [detallesRemissions.cantidad, detallesRemissions.id_producto, detallesRemissions.id_inventario, id]
                        )
                    }
                }

                await connection.query(
                    "update remisiones set fecha_modificacion = now(), id_cliente = UUID_TO_BIN(?), usuario_modificador = UUID_TO_BIN(?) where BIN_TO_UUID(id) = ?;",
                    [id_cliente, usuario_modificador, id]
                );

                await connection.query(
                    "update detalle_remisiones set cantidad = ?, id_producto = UUID_TO_BIN(?), id_inventario = UUID_TO_BIN(?) where id_producto = UUID_TO_BIN(?);",
                    [detallesRemissions.cantidad, detallesRemissions.id_producto, detallesRemissions.id_inventario, detallesRemissions.id_producto]
                );
            }

            res.send("La remisión se modifico correctamente...");
        } catch (error: any) {            
            res.status(500).json({ error: error.message });
        }
    };

    // * Delete product by id in remission
    static deleteProductInRemission = async (req: Request, res: Response) => {
        const { id } = req.params;
        const { id_producto, id_inventario } = req.body;

        try {

            const productExistsInInventory = await connection.query(
                "select count(BIN_TO_UUID(dr.id_producto)) as existsProductInventory from detalle_remisiones dr inner join inventario i on i.id=dr.id_inventario where dr.id_producto = UUID_TO_BIN(?) and dr.id_inventario = UUID_TO_BIN(?) and dr.id_remisiones = UUID_TO_BIN(?);",
                [id_producto, id_inventario, id]
            );
            const [{ existsProductInventory }] = (productExistsInInventory as any)[0];

            if (existsProductInventory > 0) {

                const existsProductInRemission = await connection.query(
                    "select count(BIN_TO_UUID(id_producto)) as productExists from detalle_remisiones where id_producto = UUID_TO_BIN(?) and id_remisiones = UUID_TO_BIN(?);",
                    [id_producto, id]
                );
                const [{ productExists }] = (existsProductInRemission as any)[0];
                if (productExists === 0) {
                    const error = new Error("El producto que estas buscando no existe en la remisión...");
                    return res.status(404).json({ error: error.message });
                }

                const getStockInventory = await connection.query(
                    "select stock, cantidad_remision from inventario where id_producto = UUID_TO_BIN(?);",
                    [id_producto]
                );
                const [{ stock, cantidad_remision }] = (getStockInventory as any)[0];

                const getAmmountDetailsRemission = await connection.query(
                    "select cantidad as ammmountRemission from detalle_remisiones where id_producto = UUID_TO_BIN(?);",
                    [id_producto]
                );
                const [{ ammmountRemission }] = (getAmmountDetailsRemission as any)[0];

                const resultNewStock = stock + ammmountRemission;

                if (cantidad_remision === 0) {
                    await connection.query(
                        "update inventario set cantidad_remision = null, stock = ? where id_producto = UUID_TO_BIN(?);",
                        [resultNewStock, id_producto]
                    );
                }
                else {
                    const resultNewAmmount = ammmountRemission - cantidad_remision;

                   await connection.query(
                        "update inventario set cantidad_remision = ?, stock = ? where id_producto = UUID_TO_BIN(?);",
                        [resultNewAmmount, resultNewStock, id_producto]
                    );
                }

                await connection.query(
                    "delete from detalle_remisiones where id_producto = UUID_TO_BIN(?) and id_remisiones = UUID_TO_BIN(?);",
                    [id_producto, id]
                )

                res.send("Producto eliminado correctamente...");
            }
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
