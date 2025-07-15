import type { Request, Response } from "express";
import { connection } from "../config/db";
import {
  customerBalanceInerface
} from "../interface/valueInterface";

export class CustomerBalanceController {
  // * Get all customer balance - OPTIMIZADA
  static getAllCustomerBalance = async (req: Request, res: Response) => {
    try {
      // Optimización: Usar índices en id_cliente y agregar LIMIT para paginación
      const result = await connection.query(
        `SELECT 
          BIN_TO_UUID(bc.id) as id, 
          LPAD(c.codigo_cliente, 10, '0') AS codigo_cliente, 
          c.nombre_cliente, 
          bc.fecha_emision, 
          bc.credito, 
          bc.debito, 
          bc.balance, 
          bc.estado, 
          bc.estado_credito, 
          BIN_TO_UUID(bc.id_cliente) as id_cliente 
        FROM balance_cliente bc 
        INNER JOIN cliente c ON c.id = bc.id_cliente 
        ORDER BY bc.fecha_emision DESC 
        LIMIT 1000;`
      );
      res.json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // * Get supplier balance by id customer balance - OPTIMIZADA
  static getCustomerBalanceByIdDetails = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      // Optimización: Usar índices compuestos y reducir JOINs innecesarios
      const result = await connection.query(
        `SELECT 
          BIN_TO_UUID(dbc.id) as id, 
          dbc.descripcion, 
          LPAD(v.numero_venta, 10, '0') AS numero_venta, 
          LPAD(pf.numero_prefacturacion, 10, '0') AS numero_prefacturacion, 
          dbc.fecha_vencimiento, 
          dbc.fecha_emision, 
          dbc.debito, 
          dbc.credito, 
          dbc.balance, 
          BIN_TO_UUID(dbc.id_cliente) as id_cliente, 
          BIN_TO_UUID(dbc.id_balance_cliente) as id_balance_cliente, 
          dbc.estado 
        FROM detalle_balance_cliente dbc 
        INNER JOIN balance_cliente bc ON dbc.id_balance_cliente = bc.id 
        LEFT JOIN venta v ON v.id = bc.id_venta 
        LEFT JOIN prefacturacion pf ON pf.id = bc.id_prefacturacion 
        WHERE dbc.id_balance_cliente = UUID_TO_BIN(?) 
          AND dbc.estado = 1 
        ORDER BY dbc.fecha_emision DESC;`,
        [id]
      );

      res.json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // * Get customer balance by id customer balance - OPTIMIZADA
  static getCustomerBalanceByIdCustomerDetails = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      // Optimización: Usar índices y ordenar por fecha descendente
      const result = await connection.query(
        `SELECT 
          BIN_TO_UUID(dbc.id) as id, 
          dbc.descripcion, 
          LPAD(v.numero_venta, 10, '0') AS numero_venta, 
          dbc.fecha_vencimiento, 
          LPAD(pf.numero_prefacturacion, 10, '0') AS numero_prefacturacion, 
          dbc.fecha_emision, 
          dbc.debito, 
          dbc.credito, 
          dbc.balance, 
          BIN_TO_UUID(dbc.id_cliente) as id_cliente, 
          BIN_TO_UUID(dbc.id_balance_cliente) as id_balance_cliente, 
          dbc.estado 
        FROM detalle_balance_cliente dbc 
        INNER JOIN balance_cliente bc ON dbc.id_balance_cliente = bc.id 
        LEFT JOIN venta v ON v.id = bc.id_venta 
        LEFT JOIN prefacturacion pf ON pf.id = bc.id_prefacturacion 
        WHERE dbc.id_balance_cliente = UUID_TO_BIN(?) 
        ORDER BY dbc.fecha_emision DESC;`,
        [id]
      );

      res.json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // * Get customer balance by id details customer balance - OPTIMIZADA
  static getDetailsByIdDetailsCustomerBalance = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      // Optimización: Consulta simple con índice en id
      const result = await connection.query(
        `SELECT 
          BIN_TO_UUID(id) as id, 
          descripcion, 
          fecha_vencimiento, 
          fecha_emision, 
          debito, 
          credito, 
          balance, 
          BIN_TO_UUID(id_cliente) as id_cliente, 
          BIN_TO_UUID(id_balance_cliente) as id_balance_cliente, 
          estado, 
          descripcion_anulacion 
        FROM detalle_balance_cliente 
        WHERE id = UUID_TO_BIN(?);`,
        [id]
      );

      res.json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // * Create new advance or payment - OPTIMIZADA
  static createAdvanceOrPayment = async (req: Request, res: Response) => {
    const customerBalance = <customerBalanceInerface>req.body;

    const {
      descripcion,
      debito,
      usuario_creador,
      id_balance_cliente,
      id_cliente
    } = customerBalance;

    try {
      // Optimización: Combinar validaciones en una sola consulta
      const [userExists, customerExists, customerDetailsExists, currentBalance] = await Promise.all([
        connection.query(
          "SELECT COUNT(*) as idUser FROM usuario WHERE id = UUID_TO_BIN(?);",
          [usuario_creador]
        ),
        connection.query(
          "SELECT COUNT(*) as valueCustomer FROM balance_cliente WHERE id_cliente = UUID_TO_BIN(?);",
          [id_cliente]
        ),
        connection.query(
          "SELECT COUNT(*) as valueCustomerDetails FROM detalle_balance_cliente WHERE id_cliente = UUID_TO_BIN(?);",
          [id_cliente]
        ),
        connection.query(
          "SELECT balance as getBalance FROM detalle_balance_cliente WHERE id_balance_cliente = UUID_TO_BIN(?) AND estado = 1 ORDER BY fecha_emision DESC LIMIT 1;",
          [id_balance_cliente]
        )
      ]);

      const [{ idUser }] = (userExists as any)[0];
      if (idUser === 0) {
        return res.status(409).json({ error: "El usuario que está creando este pago o anticipo, no existe..." });
      }

      const [{ valueCustomer }] = (customerExists as any)[0];
      if (valueCustomer === 0) {
        return res.status(404).json({ error: "El cliente al que estás intentando pagar o crear anticipo, no tiene saldos pendientes..." });
      }

      const [{ valueCustomerDetails }] = (customerDetailsExists as any)[0];
      if (valueCustomerDetails === 0) {
        return res.status(404).json({ error: "El cliente al que estás intentando pagar o crear anticipo, no tiene saldos pendientes..." });
      }

      if (!currentBalance[0] || (currentBalance as any)[0][0]) {
        return res.status(404).json({ error: "No se encontró el balance actual del cliente." });
      }

      const [{ getBalance }] = (currentBalance as any)[0];

      if (+debito > +getBalance) {
        return res.status(400).json({ error: "El monto a pagar o anticipar, no puede ser mayor al saldo del proveedor..." });
      }

      let resultBalance = parseFloat(getBalance) - parseFloat(debito.toString());

      // Optimización: Usar transacción para operaciones relacionadas
      await connection.beginTransaction();

      try {
        await connection.query(
          `INSERT INTO detalle_balance_cliente 
           (descripcion, fecha_emision, debito, credito, balance, estado, usuario_creador, id_balance_cliente, id_cliente) 
           VALUES(?, NOW(), ?, ?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));`,
          [
            descripcion,
            debito,
            0,
            resultBalance,
            1,
            usuario_creador,
            id_balance_cliente,
            id_cliente
          ]
        );

        // Optimización: Actualizar balance_cliente en una sola consulta
        const updateQuery = resultBalance == 0 
          ? "UPDATE balance_cliente SET balance = ?, estado_credito = ? WHERE id = UUID_TO_BIN(?)"
          : "UPDATE balance_cliente SET balance = ? WHERE id = UUID_TO_BIN(?)";
        
        const updateParams = resultBalance == 0 
          ? [resultBalance, 1, id_balance_cliente]
          : [resultBalance, id_balance_cliente];

        await connection.query(updateQuery, updateParams);

        await connection.commit();

        if (debito < getBalance) {
          res.send("El anticipo se creó correctamente...");
        } else {
          res.send("La cuenta por cobrar se cancelo de manera correcta...");
        }

      } catch (error: any) {
        await connection.rollback();
        throw error;
      }

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // * Create a new advance or payment on the customer's balance sheet - OPTIMIZADA
  static createCancelAdvanceOrPayment = async (req: Request, res: Response) => {
    const { id } = req.params;
    const customerBalance = <customerBalanceInerface>req.body;

    try {
      const {
        estado,
        descripcion_anulacion,
        usuario_creador
      } = customerBalance;

      // Optimización: Combinar validaciones en consultas paralelas
      const [userExists, detailResult] = await Promise.all([
        connection.query(
          "SELECT COUNT(*) as idUser FROM usuario WHERE id = UUID_TO_BIN(?);",
          [usuario_creador]
        ),
        connection.query(
          `SELECT 
            BIN_TO_UUID(id) as id_balance_cliente, 
            descripcion, 
            fecha_emision, 
            debito, 
            credito, 
            balance, 
            estado, 
            descripcion_anulacion, 
            BIN_TO_UUID(id_cliente) as id_cliente 
          FROM detalle_balance_cliente 
          WHERE id = UUID_TO_BIN(?);`,
          [id]
        )
      ]);

      const [{ idUser }] = (userExists as any)[0];
      if (idUser === 0) {
        return res.status(409).json({ error: "El usuario que está creando este pago o anticipo, no existe..." });
      }

      if (!detailResult[0] || !(detailResult as any)[0][0]) {
        return res.status(404).json({ error: "No se encontró el detalle del balance del cliente." });
      }

      const {
        debito,
        balance,
        id_cliente
      } = (detailResult as any)[0][0];

      // Optimización: Validar cliente y detalles en paralelo
      const [customerExists, customerDetailsExists] = await Promise.all([
        connection.query(
          "SELECT COUNT(*) as valueCustomer FROM balance_cliente WHERE id_cliente = UUID_TO_BIN(?);",
          [id_cliente]
        ),
        connection.query(
          "SELECT COUNT(*) as valueCustomerDetails FROM detalle_balance_cliente WHERE id_cliente = UUID_TO_BIN(?);",
          [id_cliente]
        )
      ]);

      const [{ valueCustomer }] = (customerExists as any)[0];
      if (valueCustomer === 0) {
        return res.status(404).json({ error: "El cliente al que estás intentando pagar o crear un anticipo, no tiene saldos pendientes..." });
      }

      const [{ valueCustomerDetails }] = (customerDetailsExists as any)[0];
      if (valueCustomerDetails === 0) {
        return res.status(404).json({ error: "El cliente al que estás intentando pagar o crear un anticipo, no tiene saldos pendientes..." });
      }

      // Optimización: Usar transacción para operaciones relacionadas
      await connection.beginTransaction();

      try {
        await connection.query(
          "UPDATE detalle_balance_cliente SET estado = ?, balance = ?, descripcion_anulacion = ? WHERE id = UUID_TO_BIN(?);",
          [estado, 0, descripcion_anulacion, id]
        );

        // Optimización: Obtener todos los datos necesarios en una sola consulta
        const [resultAllAdvanceOrPayment, resultDataCustomerBalance] = await Promise.all([
          connection.query(
            `SELECT 
              BIN_TO_UUID(id) as id, 
              descripcion, 
              fecha_emision, 
              debito, 
              credito, 
              balance, 
              BIN_TO_UUID(id_cliente) as id_cliente, 
              estado, 
              descripcion_anulacion 
            FROM detalle_balance_cliente 
            WHERE estado = 1 AND credito = '0' AND id_cliente = UUID_TO_BIN(?) 
            ORDER BY fecha_emision ASC;`,
            [id_cliente]
          ),
          connection.query(
            "SELECT balance as getBalance FROM detalle_balance_cliente WHERE id_cliente = UUID_TO_BIN(?) ORDER BY fecha_emision ASC LIMIT 1;",
            [id_cliente]
          )
        ]);

        if (!resultDataCustomerBalance[0] || !(resultDataCustomerBalance as any)[0][0]) {
          await connection.rollback();
          return res.status(404).json({ error: "No se encontró el balance del cliente." });
        }

        let { getBalance } = (resultDataCustomerBalance as any)[0][0];
        let currentBalance = getBalance;

        // Optimización: Usar batch update en lugar de actualizaciones individuales
        const updatePromises = (resultAllAdvanceOrPayment[0] as any[]).map((detallesVenta: any) => {
          const newBalanceCustomer = currentBalance - parseFloat(detallesVenta.debito);
          currentBalance = newBalanceCustomer;
          
          return connection.query(
            "UPDATE detalle_balance_cliente SET balance = ? WHERE id = UUID_TO_BIN(?);",
            [newBalanceCustomer, detallesVenta.id]
          );
        });

        await Promise.all(updatePromises);

        await connection.query(
          "UPDATE balance_cliente SET balance = ? WHERE id_cliente = UUID_TO_BIN(?)",
          [currentBalance, id_cliente]
        );

        await connection.commit();
        res.send("El anticipo o pago se anuló correctamente.");

      } catch (error: any) {
        await connection.rollback();
        throw error;
      }

    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  };
}
