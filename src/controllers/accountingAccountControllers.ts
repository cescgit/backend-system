import type { Request, Response } from "express";
import { connection } from "../config/db";
import type {
    accountingAccountInterface,
  brandInterface
} from "../interface/valueInterface";

export class AccountingAccountController {
  // * Get alls accounting accounts
  static getAllAccountingAccount = async (req: Request, res: Response) => {
    try {
      const result = await connection.query(
        "select BIN_TO_UUID(cc.id) as id, cc.numero_cuenta, cc.descripcion, cc.nivel_cuenta, cc.ruc, cc.centro_costo, cc.balance, BIN_TO_UUID(cc.tipo_cuenta) as id_tipo_cuenta, tc.nombre as tipo_cuenta, cc.fecha_creacion from cuenta_contable cc inner join tipo_cuenta tc on cc.tipo_cuenta=tc.id order by cc.numero_cuenta;"
      );
      res.json(result[0]);
    } catch (error) {
       res.status(500).json({ error: error.message });
    }
  };

  // * Get accounting account by id
  static getAccountingAccountById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const result = await connection.query(
        "select BIN_TO_UUID(cc.id) as id, cc.numero_cuenta, cc.descripcion, cc.nivel_cuenta, cc.ruc, cc.centro_costo, cc.balance, BIN_TO_UUID(cc.tipo_cuenta) as id_tipo_cuenta, tc.nombre as tipo_cuenta, cc.fecha_creacion from cuenta_contable cc inner join tipo_cuenta tc on cc.tipo_cuenta=tc.id where BIN_TO_UUID(cc.id) = ?;",
        [id]
      );

      res.json(result[0]);
    } catch (error) {
       res.status(500).json({ error: error.message });
    }
  };

  // *  Create new accounting account
  static createAccountingAccount = async (req: Request, res: Response) => {
    const accountingAccount = <accountingAccountInterface>req.body;

    const { 
        numero_cuenta,
        descripcion,
        tipo_cuenta,
        nivel_cuenta,
        ruc,
        centro_costo,
        balance,
        usuario_creador
     } =
    accountingAccount;

    try {
      const userExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
        [usuario_creador]
      );
      const [{ idUser }] = userExists[0];
      if (idUser === 0) {
        const error = new Error("El usuario que esta creando esta cuenta contable, no existe...");
        return res.status(409).json({ error: error.message });
      }

      const typeAccountExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idTypeAccount from tipo_cuenta where BIN_TO_UUID(id) = ?;",
        [tipo_cuenta]
      );
      const [{ idTypeAccount }] = typeAccountExists[0];
      if (idTypeAccount === 0) {
        const error = new Error("El tipo de cuenta no existe...");
        return res.status(409).json({ error: error.message });
      }

      const accountExists = await connection.query(
        "select count(numero_cuenta) as valueNumberAccount from cuenta_contable where numero_cuenta = ?;",
        [numero_cuenta]
      );
      const [{ valueNumberAccount }] = accountExists[0];
      if (valueNumberAccount === 1) {
        const error = new Error("Esta cuenta contable ya existen en la base de datos...");
        return res.status(409).json({ error: error.message });
      }

      const result = await connection.query(
        "insert into cuenta_contable (numero_cuenta, descripcion, nivel_cuenta, ruc, centro_costo, balance, tipo_cuenta, usuario_creador, fecha_creacion) values (?, ?, ?, ?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?), now());",
        [numero_cuenta, descripcion, nivel_cuenta, ruc, centro_costo, balance, tipo_cuenta, usuario_creador]
      );

      res.send("La cuenta contable fue creada correctamente...");
    } catch (error) {
       res.status(500).json({ error: error.message });
    }
  };

  // * Update accounting account by id
  static updateAccountingAccount = async (req: Request, res: Response) => {
    const { id } = req.params;
    const accountingAccount = <accountingAccountInterface>req.body;
    
    const { 
        numero_cuenta,
        descripcion,
        tipo_cuenta,
        nivel_cuenta,
        ruc,
        centro_costo,
        balance,
        usuario_modificador
     } =
    accountingAccount;

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

      const typeAccountExists = await connection.query(
        "select count(BIN_TO_UUID(tipo_cuenta)) as idTypeAccount from tipo_cuenta where BIN_TO_UUID(id) = ?;",
        [tipo_cuenta]
      );
      const [{ idTypeAccount }] = typeAccountExists[0];
      if (idTypeAccount === 0) {
        const error = new Error("El tipo de cuenta no existe...");
        return res.status(409).json({ error: error.message });
      }

      const accountingAccountExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idAccountingAccount from cuenta_contable where BIN_TO_UUID(id) = ?;",
        [id]
      );
      const [{ idAccountingAccount }] = accountingAccountExists[0];
      if (idAccountingAccount === 0) {
        const error = new Error(
          "La cuenta contable que estas buscando, no se encontro..."
        );
        return res.status(404).json({ error: error.message });
      }

      const accountExists = await connection.query(
        "select count(numero_cuenta) as valueNumberAccount from cuenta_contable where numero_cuenta = ? and BIN_TO_UUID(id) = ?;",
        [numero_cuenta, id]
      );
      const [{ valueNumberAccount }] = accountExists[0];
      if (valueNumberAccount === 1) {
        const error = new Error("Esta cuenta contable ya existen en la base de datos...");
        return res.status(409).json({ error: error.message });
      }

      const result = await connection.query(
        "update cuenta_contable set numero_cuenta = ?, descripcion = ?, tipo_cuenta = ?, nivel_cuenta = ?, ruc = ?, centro_costo = ?, balance = ?, usuario_modificador = UUID_TO_BIN(?), fecha_modificacion = now() where BIN_TO_UUID(id) = ?;",
        [numero_cuenta, descripcion, tipo_cuenta, nivel_cuenta, ruc, centro_costo, balance, usuario_modificador, id]
      );

      res.send("La cuenta contable se modifico correctamente...");
    } catch (error) {
       res.status(500).json({ error: error.message });
    }
  };
}
