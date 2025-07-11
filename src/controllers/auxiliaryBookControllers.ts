import type { Request, Response } from "express";
import { connection } from "../config/db";
import type {
    auxiliaryBookInterface
} from "../interface/valueInterface";

export class AuxiliaryBookController {
    // * Get all auxiliary books
    static getAllAuxiliaryBooks = async (req: Request, res: Response) => {
        try {
            const result = await connection.query(
                "select BIN_TO_UUID(id) as id, codigo, descripcion, fecha_creacion from libro_auxiliar order by codigo;"
            );
            res.json(result[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    // * Get auxiliary book by id
    static getAuxilaryBookById = async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            const result = await connection.query(
                "select BIN_TO_UUID(id) as id, codigo, descripcion, fecha_creacion from libro_auxiliar where BIN_TO_UUID(id) = ?;",
                [id]
            );

            res.json(result[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    // *  Create new auxiliary book
    static createAuxiliaryBook = async (req: Request, res: Response) => {
        const auxiliaryBook = <auxiliaryBookInterface>req.body;

        const {
            codigo,
            descripcion,            
            usuario_creador
        } =
            auxiliaryBook;

        try {
            const userExists = await connection.query(
                "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
                [usuario_creador]
            );
            const [{ idUser }] = userExists[0];
            if (idUser === 0) {
                const error = new Error("El usuario que esta creando este libro auxiliar, no existe...");
                return res.status(409).json({ error: error.message });
            }

            const auxiliaryBookExists = await connection.query(
                "select count(codigo) as valueNumberAccount from libro_auxiliar where codigo = ?;",
                [codigo]
            );
            const [{ valueNumberAccount }] = auxiliaryBookExists[0];
            if (valueNumberAccount === 1) {
                const error = new Error("Este libro auxiliar ya existen en la base de datos...");
                return res.status(409).json({ error: error.message });
            }

            await connection.query(
                "insert into libro_auxiliar (codigo, descripcion, usuario_creador, fecha_creacion) values (?, ?, UUID_TO_BIN(?), now());",
                [codigo, descripcion, usuario_creador]
            );

            res.send("El libro auxiliar fue creado correctamente...");
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    // * Update auxiliary book by id
    static updateAuxiliaryBook = async (req: Request, res: Response) => {
        const { id } = req.params;
        const auxiliaryBook = <auxiliaryBookInterface>req.body;

        const {
            codigo,
            descripcion,            
            usuario_modificador
        } = auxiliaryBook;

        try {
            const userExists = await connection.query(
                "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
                [usuario_modificador]
            );
            const [{ idUser }] = userExists[0];
            if (idUser === 0) {
                const error = new Error("El usuario que esta editando esta cuenta contable no existe...");
                return res.status(409).json({ error: error.message });
            }

            const auxiliaryBookExists = await connection.query(
                "select count(BIN_TO_UUID(id)) as idAuxiliaryBook from libro_auxiliar where BIN_TO_UUID(id) = ?;",
                [id]
            );
            const [{ idAuxiliaryBook }] = auxiliaryBookExists[0];
            if (idAuxiliaryBook === 0) {
                const error = new Error(
                    "El libro auxiliar que estas buscando, no se encontro..."
                );
                return res.status(404).json({ error: error.message });
            }

            const codeAuxiliaryBookExists = await connection.query(
                "select count(codigo) as valueNumberAccount from libro_auxiliar where codigo = ? and BIN_TO_UUID(id) = ?;",
                [codigo, id]
            );
            const [{ valueNumberAccount }] = codeAuxiliaryBookExists[0];
            if (valueNumberAccount === 1) {
                const error = new Error("Este libro auxiliar ya existe en la base de datos...");
                return res.status(409).json({ error: error.message });
            }

            const result = await connection.query(
                "update libro_auxiliar set codigo = ?, descripcion = ?, usuario_modificador = UUID_TO_BIN(?), fecha_modificacion = now() where BIN_TO_UUID(id) = ?;",
                [codigo, descripcion, usuario_modificador, id]
            );

            res.send("El libro auxiliar se modifico correctamente...");
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
}
