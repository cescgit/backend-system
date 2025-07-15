import type { Request, Response } from "express";
import { connection } from "../config/db";
import type {
    accountingSourceInterface
} from "../interface/valueInterface";

export class AccountingSourcesController {
    // * Get all accounting sources
    static getAllAccountingSources = async (req: Request, res: Response) => {
        try {
            const result = await connection.query(
                "select BIN_TO_UUID(id) as id, codigo, descripcion, fecha_creacion from fuente_contable order by codigo;"
            );
            res.json(result[0]);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    // * Get accounting sources by id
    static getAccountingSourcesById = async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            const result = await connection.query(
                "select BIN_TO_UUID(id) as id, codigo, descripcion, fecha_creacion from fuente_contable where BIN_TO_UUID(id) = ?;",
                [id]
            );

            res.json(result[0]);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    // *  Create new accounting sources
    static createAccountingSources = async (req: Request, res: Response) => {
        const accountingSources = <accountingSourceInterface>req.body;

        const {
            codigo,
            descripcion,            
            usuario_creador
        } =
        accountingSources;

        try {
            const [userExists]: any = await connection.query(
                "SELECT COUNT(*) as idUser FROM usuario WHERE BIN_TO_UUID(id) = ?;",
                [req.body.usuario_creador]
            );
            const [{ idUser }] = userExists;
            if (idUser === 0) {
                const error = new Error("El usuario que esta creando esta fuente contable, no existe...");
                return res.status(409).json({ error: error.message });
            }

            const [accountingSourcesExists]: any = await connection.query(
                "SELECT COUNT(*) as valueName FROM fuente_contable WHERE nombre_fuente = ?;",
                [req.body.nombre_fuente]
            );
            const [{ valueName }] = accountingSourcesExists;
            if (valueName === 1) {
                const error = new Error("Esta fuente contable ya existen en la base de datos...");
                return res.status(409).json({ error: error.message });
            }

            await connection.query(
                "insert into fuente_contable (codigo, descripcion, usuario_creador, fecha_creacion) values (?, ?, UUID_TO_BIN(?), now());",
                [codigo, descripcion, usuario_creador]
            );

            res.send("La fuente contable fue creada correctamente...");
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    // * Update auxiliary book by id
    static updateAccountingSources = async (req: Request, res: Response) => {
        const { id } = req.params;
        const accountingSources = <accountingSourceInterface>req.body;

        const {
            codigo,
            descripcion,            
            usuario_modificador
        } = accountingSources;

        try {
            const [userExists2]: any = await connection.query(
                "SELECT COUNT(*) as idUser FROM usuario WHERE BIN_TO_UUID(id) = ?;",
                [req.body.usuario_modificador]
            );
            const [{ idUser: idUser2 }] = userExists2;
            if (idUser2 === 0) {
                const error = new Error("El usuario que esta creando esta fuente contable, no existe...");
                return res.status(409).json({ error: error.message });
            }

            const [accountingSourcesExists2]: any = await connection.query(
                "SELECT COUNT(*) as valueName FROM fuente_contable WHERE nombre_fuente = ?;",
                [req.body.nombre_fuente]
            );
            const [{ valueName: valueName2 }] = accountingSourcesExists2;
            if (valueName2 === 0) {
                const error = new Error(
                    "La fuente contable que estas buscando, no se encontro..."
                );
                return res.status(404).json({ error: error.message });
            }

            const codeAuxiliaryBookExists = await connection.query(
                "select count(codigo) as valueNumberAccount from fuente_contable where codigo = ? and BIN_TO_UUID(id) = ?;",
                [codigo, id]
            );
            const [{ valueNumberAccount }] = (codeAuxiliaryBookExists as any)[0];
            if (valueNumberAccount === 1) {
                const error = new Error("Esta fuente contable ya existe en la base de datos...");
                return res.status(409).json({ error: error.message });
            }

            const result = await connection.query(
                "update fuente_contable set codigo = ?, descripcion = ?, usuario_modificador = UUID_TO_BIN(?), fecha_modificacion = now() where BIN_TO_UUID(id) = ?;",
                [codigo, descripcion, usuario_modificador, id]
            );

            res.send("La fuente contable se modifico correctamente...");
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };
}
