import type { Request, Response } from "express";
import { connection } from "../config/db";
import type {
    typeAccountInterface,  
} from "../interface/valueInterface";

export class TypeAccountController {
  // * Get alls type accounts
  static getAllTypeAccount = async (req: Request, res: Response) => {
    try {
      const result = await connection.query(
        "select BIN_TO_UUID(id) as id, nombre, descripcion, fecha_creacion from tipo_cuenta order by nombre;"
      );
      res.json(result[0]);
    } catch (error) {
       res.status(500).json({ error: error.message });
    }
  };

  // * Get type account by id
  static getTypeAccountById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const result = await connection.query(
        "select BIN_TO_UUID(id) as id, nombre, descripcion, fecha_creacion from tipo_cuenta where BIN_TO_UUID(id) = ?;",
        [id]
      );

      res.json(result[0]);
    } catch (error) {
       res.status(500).json({ error: error.message });
    }
  };

  // *  Create new type account
  static createTypeAccount = async (req: Request, res: Response) => {
    const typeAccount = <typeAccountInterface>req.body;

    const { 
        nombre,
        descripcion,        
        usuario_creador
     } =
    typeAccount;

    try {
      const userExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
        [usuario_creador]
      );
      const [{ idUser }] = userExists[0];
      if (idUser === 0) {
        const error = new Error("El usuario que esta creando este tipo cuenta, no existe...");
        return res.status(409).json({ error: error.message });
      }

      const typeAccountExists = await connection.query(
        "select count(nombre) as valueNaneAccount from tipo_cuenta where nombre = ?;",
        [nombre]
      );
      const [{ valueNaneAccount }] = typeAccountExists[0];
      if (valueNaneAccount === 1) {
        const error = new Error("Este tipo de cuenta ya existen en la base de datos...");
        return res.status(409).json({ error: error.message });
      }

      const result = await connection.query(
        "insert into tipo_cuenta (nombre, descripcion, fecha_creacion, usuario_creador) values (?, ?, now(),  UUID_TO_BIN(?));",
        [nombre, descripcion,usuario_creador]
      );

      res.send("El tipo de cuenta fue creada correctamente...");
    } catch (error) {
       res.status(500).json({ error: error.message });
    }
  };

  // * Update type account by id
  static updateTypeAccount = async (req: Request, res: Response) => {
    const { id } = req.params;
    const typeAccount = <typeAccountInterface>req.body;
    
    const { 
        nombre,
        descripcion,        
        usuario_modificador
     } =
    typeAccount;

    try {
      const userExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
        [usuario_modificador]
      );
      const [{ idUser }] = userExists[0];
      if (idUser === 0) {
        const error = new Error("El usuario que esta editando este tipo de cuenta no existe...");
        return res.status(409).json({ error: error.message });
      }

      const typeAccountExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idTypeAccount from tipo_cuenta where BIN_TO_UUID(id) = ?;",
        [id]
      );
      const [{ idTypeAccount }] = typeAccountExists[0];
      if (idTypeAccount === 0) {
        const error = new Error(
          "El tipo de cuenta que estas buscando, no se encontro..."
        );
        return res.status(404).json({ error: error.message });
      }

      const typeAccountNameExists = await connection.query(
        "select count(nombre) as valueNameExists from tipo_cuenta where nombre = ? and BIN_TO_UUID(id) = ?;",
        [nombre, id]
      );
      const [{ valueNameExists }] = typeAccountNameExists[0];
      if (valueNameExists === 1) {
        const error = new Error("Este tipo de cuenta ya existen en la base de datos...");
        return res.status(409).json({ error: error.message });
      }

      const result = await connection.query(
        "update tipo_cuenta set nombre = ?, descripcion = ?, usuario_modificador = UUID_TO_BIN(?), fecha_modificacion = now() where BIN_TO_UUID(id) = ?;",
        [nombre, descripcion, usuario_modificador, id]
      );

      res.send("El tipo de cuenta se modifico correctamente...");
    } catch (error) {
       res.status(500).json({ error: error.message });
    }
  };
}
