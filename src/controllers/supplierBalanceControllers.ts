import type { Request, Response } from "express";
import { connection } from "../config/db";
import type {
  supplierBalanceInerface
} from "../interface/valueInterface";

export class SupplierBalanceController {
  // * Get all supplier balance
  static getAllSupplierBalance = async (req: Request, res: Response) => {
    try {
      const result = await connection.query(
        "select BIN_TO_UUID(bp.id) as id, LPAD(p.codigo_proveedor, 10, '0') AS codigo_proveedor, p.nombre_proveedor, bp.fecha_emision, bp.credito, bp.debito, bp.balance, bp.estado, bp.estado_credito, BIN_TO_UUID(bp.id_proveedor) as id_proveedor from balance_proveedor bp inner join proveedor p on p.id=bp.id_proveedor;"
      );
      res.json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // * Get supplier balance by id supplier balance
  static getSupplierBalanceByIdDetails = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const result = await connection.query(
        "select BIN_TO_UUID(dbp.id) as id, dbp.descripcion, LPAD(c.numero_compra, 10, '0') AS numero_compra, dbp.fecha_vencimiento, dbp.fecha_emision, dbp.debito, dbp.credito, dbp.balance, BIN_TO_UUID(dbp.id_proveedor) as id_proveedor, BIN_TO_UUID(dbp.id_balance_proveedor) as id_balance_proveedor, dbp.estado from detalle_balance_proveedor dbp inner join balance_proveedor bp on dbp.id_balance_proveedor=bp.id inner join compra c on c.id=bp.id_compra where BIN_TO_UUID(dbp.id_balance_proveedor) = ? and dbp.estado = 1 order by dbp.fecha_emision;",
        [id]
      );

      res.json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // * Get supplier balance by id supplier balance
  static getSupplierBalanceByIdSupplierDetails = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const result = await connection.query(
        "select BIN_TO_UUID(dbp.id) as id, dbp.descripcion, LPAD(c.numero_compra, 10, '0') AS numero_compra, dbp.fecha_vencimiento, dbp.fecha_emision, dbp.debito, dbp.credito, dbp.balance, BIN_TO_UUID(dbp.id_proveedor) as id_proveedor, BIN_TO_UUID(dbp.id_balance_proveedor) as id_balance_proveedor, dbp.estado from detalle_balance_proveedor dbp inner join balance_proveedor bp on dbp.id_balance_proveedor=bp.id inner join compra c on c.id=bp.id_compra where BIN_TO_UUID(dbp.id_balance_proveedor) = ? order by dbp.fecha_emision;",
        [id]
      );

      res.json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // * Get supplier balance by id details supplier balance
  static getDetailsByIdDetailsSupplierBalance = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const result = await connection.query(
        "select BIN_TO_UUID(id) as id, descripcion, fecha_vencimiento,  fecha_emision, debito, credito, balance, BIN_TO_UUID(id_proveedor) as id_proveedor, BIN_TO_UUID(id_balance_proveedor) as id_balance_proveedor, estado, descripcion_anulacion from detalle_balance_proveedor where id = UUID_TO_BIN(?);",
        [id]
      );

      res.json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // *  Create new advance or payment
  static createAdvanceOrPayment = async (req: Request, res: Response) => {
    const supplierBalance = <supplierBalanceInerface>req.body;

    const {
      descripcion,
      debito,
      usuario_creador,
      id_balance_proveedor,
      id_proveedor
    } = supplierBalance;

    try {
      const [userRow]: any = await connection.query(
        "SELECT COUNT(*) as idUser FROM usuario WHERE BIN_TO_UUID(id) = ?;",
        [usuario_creador]
      );
      const idUser = userRow[0]?.idUser || 0;
      if (idUser === 0) {
        return res.status(409).json({ error: "El usuario que está creando este pago o anticipo, no existe..." });
      }

      const [supplierRow]: any = await connection.query(
        "SELECT COUNT(*) as valueSupplier FROM balance_proveedor WHERE BIN_TO_UUID(id_proveedor) = ?;",
        [id_proveedor]
      );
      const valueSupplier = supplierRow[0]?.valueSupplier || 0;
      if (valueSupplier === 0) {
        return res.status(404).json({ error: "El proveedor al que estás intentando pagar o crear anticipo, no tiene saldos pendientes..." });
      }

      const [detailsRow]: any = await connection.query(
        "SELECT COUNT(*) as valueSupplierDetails FROM detalle_balance_proveedor WHERE BIN_TO_UUID(id_proveedor) = ?;",
        [id_proveedor]
      );
      const valueSupplierDetails = detailsRow[0]?.valueSupplierDetails || 0;
      if (valueSupplierDetails === 0) {
        return res.status(404).json({ error: "El proveedor al que estás intentando pagar o crear anticipo, no tiene saldos pendientes..." });
      }

      const [balanceRow]: any = await connection.query(
        "SELECT balance as getBalance FROM detalle_balance_proveedor WHERE id_balance_proveedor = UUID_TO_BIN(?) AND estado = 1 ORDER BY fecha_emision DESC LIMIT 1;",
        [id_balance_proveedor]
      );
      const getBalance = balanceRow[0]?.getBalance ?? 0;

      if (+debito > +getBalance) {
        return res.status(400).json({ error: "El monto a pagar o anticipar, no puede ser mayor al saldo del proveedor..." });
      }

      let resultBalance = parseFloat(getBalance) - parseFloat(debito.toString());

      await connection.query(
        "INSERT INTO detalle_balance_proveedor (descripcion, fecha_emision, debito, credito, balance, estado, usuario_creador, id_balance_proveedor, id_proveedor) VALUES (?, NOW(), ?, ?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));",
        [
          descripcion,
          debito,
          0,
          resultBalance,
          1,
          usuario_creador,
          id_balance_proveedor,
          id_proveedor
        ]
      );

      if (resultBalance == 0) {
        await connection.query(
          "UPDATE balance_proveedor SET balance = ?, estado_credito = ? WHERE BIN_TO_UUID(id) = ?",
          [
            resultBalance,
            1,
            id_balance_proveedor
          ]
        );
      } else {
        await connection.query(
          "UPDATE balance_proveedor SET balance = ? WHERE BIN_TO_UUID(id) = ?",
          [
            resultBalance,
            id_balance_proveedor
          ]
        );
      }
      
      if (debito < getBalance) {
        res.send("El anticipo se creó correctamente...");
      }      

      res.send("La cuenta por cobrar se canceló de manera correcta...");
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // *  Create new advance or payment
  static createCancelAdvanceOrPayment = async (req: Request, res: Response) => {
    const { id } = req.params;
    const supplierBalance = <supplierBalanceInerface>req.body;

    try {
      const {
        estado,
        descripcion_anulacion,
        usuario_creador
      } = supplierBalance;

      const userExists: any = await connection.query(
        "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
        [usuario_creador]
      );
      const [{ idUser }] = userExists[0];
      if (idUser === 0) {
        return res.status(409).json({ error: "El usuario que está creando este pago o anticipo, no existe..." });
      }

      const result: any = await connection.query(
        "select BIN_TO_UUID(id) as id_balance_proveedor, descripcion, fecha_emision, debito, credito, balance, estado, descripcion_anulacion, BIN_TO_UUID(id_proveedor) as id_proveedor from detalle_balance_proveedor where id = UUID_TO_BIN(?);",
        [id]
      );

      if (!result[0] || !result[0][0]) {
        return res.status(404).json({ error: "No se encontró el detalle del balance del proveedor." });
      }

      const {
        debito,
        balance,
        id_proveedor
      } = result[0][0];

      const supplierExists: any = await connection.query(
        "select count(BIN_TO_UUID(id_proveedor)) as valueSupplier from balance_proveedor where BIN_TO_UUID(id_proveedor) = ?;",
        [id_proveedor]
      );
      const [{ valueSupplier }] = supplierExists[0];
      if (valueSupplier === 0) {
        return res.status(404).json({ error: "El proveedor al que estás intentando pagar o crear un anticipo, no tiene saldos pendientes..." });
      }

      const supplierDetailsExists: any = await connection.query(
        "select count(BIN_TO_UUID(id_proveedor)) as valueSupplierDetails from detalle_balance_proveedor where BIN_TO_UUID(id_proveedor) = ?;",
        [id_proveedor]
      );
      const [{ valueSupplierDetails }] = supplierDetailsExists[0];
      if (valueSupplierDetails === 0) {
        return res.status(404).json({ error: "El proveedor al que estás intentando pagar o crear un anticipo, no tiene saldos pendientes..." });
      }

      await connection.query(
        "update detalle_balance_proveedor set estado = ?, balance = ?, descripcion_anulacion = ? where id = UUID_TO_BIN(?);",
        [
          estado,
          0,
          descripcion_anulacion,
          id
        ]
      );

      const resultAllAdvanceOrPayment: any = await connection.query(
        "select BIN_TO_UUID(id) as id, descripcion,  fecha_emision, debito, credito, balance, BIN_TO_UUID(id_proveedor) as id_proveedor, estado, descripcion_anulacion from detalle_balance_proveedor where estado = 1 and credito ='0' and id_proveedor = UUID_TO_BIN(?) ORDER BY fecha_emision;",
        [id_proveedor]
      );

      const resultDataSupplierBalance: any = await connection.query(
        "select balance as getBalance from detalle_balance_proveedor where BIN_TO_UUID(id_proveedor) = ? order by fecha_emision asc LIMIT 1;",
        [id_proveedor]
      );

      if (!resultDataSupplierBalance[0] || !resultDataSupplierBalance[0][0]) {
        return res.status(404).json({ error: "No se encontró el balance del proveedor." });
      }

      let { getBalance } = resultDataSupplierBalance[0][0];
      let currentBalance = getBalance;

      for (const detallesCompra of resultAllAdvanceOrPayment[0]) {
        const newBalanceSupplier = currentBalance - parseFloat(detallesCompra.debito);

        await connection.query(
          "update detalle_balance_proveedor set balance = ? where id = UUID_TO_BIN(?);",
          [
            newBalanceSupplier,
            detallesCompra.id
          ]
        );
        currentBalance = newBalanceSupplier;
      }

      await connection.query(
        "update balance_proveedor set balance = ? where BIN_TO_UUID(id_proveedor) = ?",
        [
          currentBalance,
          id_proveedor
        ]
      );
      
      return res.send("El anticipo o pago se anuló correctamente...");
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  };
}
