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
    } catch (error: any) {
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
    } catch (error: any) {
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
      const [userExists]: any = await connection.query(
        "SELECT COUNT(*) as idUser FROM usuario WHERE BIN_TO_UUID(id) = ?;",
        [req.body.usuario_creador]
      );
      const [{ idUser }] = userExists;
      if (idUser === 0) {
        const error = new Error("El usuario que esta creando esta cuenta contable, no existe...");
        return res.status(409).json({ error: error.message });
      }

      const [typeAccountExists]: any = await connection.query(
        "SELECT id as idTypeAccount FROM tipo_cuenta WHERE nombre_tipo_cuenta = ?;",
        [req.body.nombre_tipo_cuenta]
      );
      const [{ idTypeAccount }] = typeAccountExists;
      if (idTypeAccount === 0) {
        const error = new Error("El tipo de cuenta no existe...");
        return res.status(409).json({ error: error.message });
      }

      const [accountExists]: any = await connection.query(
        "SELECT COUNT(*) as valueNumberAccount FROM cuenta_contable WHERE numero_cuenta = ?;",
        [req.body.numero_cuenta]
      );
      const [{ valueNumberAccount }] = accountExists;
      if (valueNumberAccount === 1) {
        const error = new Error("Esta cuenta contable ya existen en la base de datos...");
        return res.status(409).json({ error: error.message });
      }

      const result = await connection.query(
        "insert into cuenta_contable (numero_cuenta, descripcion, nivel_cuenta, ruc, centro_costo, balance, tipo_cuenta, usuario_creador, fecha_creacion) values (?, ?, ?, ?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?), now());",
        [numero_cuenta, descripcion, nivel_cuenta, ruc, centro_costo, balance, tipo_cuenta, usuario_creador]
      );

      res.send("La cuenta contable fue creada correctamente...");
    } catch (error: any) {
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
      const [userExists2]: any = await connection.query(
        "SELECT COUNT(*) as idUser FROM usuario WHERE BIN_TO_UUID(id) = ?;",
        [req.body.usuario_modificador]
      );
      const [{ idUser: idUser2 }] = userExists2;
      if (idUser2 === 0) {
        const error = new Error("El usuario que esta editando esta cuenta contable no existe...");
        return res.status(409).json({ error: error.message });
      }

      const [typeAccountExists2]: any = await connection.query(
        "SELECT id as idTypeAccount FROM tipo_cuenta WHERE nombre_tipo_cuenta = ?;",
        [req.body.nombre_tipo_cuenta]
      );
      const [{ idTypeAccount: idTypeAccount2 }] = typeAccountExists2;
      if (idTypeAccount2 === 0) {
        const error = new Error("El tipo de cuenta no existe...");
        return res.status(409).json({ error: error.message });
      }

      const [accountingAccountExists]: any = await connection.query(
        "SELECT id as idAccountingAccount FROM cuenta_contable WHERE numero_cuenta = ?;",
        [req.body.numero_cuenta]
      );
      const [{ idAccountingAccount }] = accountingAccountExists;
      if (idAccountingAccount === 0) {
        const error = new Error(
          "La cuenta contable que estas buscando, no se encontro..."
        );
        return res.status(404).json({ error: error.message });
      }

      const [accountExists2]: any = await connection.query(
        "SELECT COUNT(*) as valueNumberAccount FROM cuenta_contable WHERE numero_cuenta = ?;",
        [req.body.numero_cuenta]
      );
      const [{ valueNumberAccount: valueNumberAccount2 }] = accountExists2;
      if (valueNumberAccount2 === 1) {
        const error = new Error("Esta cuenta contable ya existen en la base de datos...");
        return res.status(409).json({ error: error.message });
      }

      const result = await connection.query(
        "update cuenta_contable set numero_cuenta = ?, descripcion = ?, tipo_cuenta = ?, nivel_cuenta = ?, ruc = ?, centro_costo = ?, balance = ?, usuario_modificador = UUID_TO_BIN(?), fecha_modificacion = now() where BIN_TO_UUID(id) = ?;",
        [numero_cuenta, descripcion, tipo_cuenta, nivel_cuenta, ruc, centro_costo, balance, usuario_modificador, id]
      );

      res.send("La cuenta contable se modifico correctamente...");
    } catch (error: any) {
       res.status(500).json({ error: error.message });
    }
  };
}
