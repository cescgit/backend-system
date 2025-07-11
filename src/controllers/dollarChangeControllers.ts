import type { Request, Response } from "express";
import { connection } from "../config/db";
import type {
  dollarChangeInterface
} from "../interface/valueInterface";

export class DollarChangeController {
  // * Get alls dollar change
  static getAllDollarChange = async (req: Request, res: Response) => {
    try {
      const result = await connection.query(
        "select BIN_TO_UUID(id) as id, compra, venta, fecha_modificacion from cambio_dolar;"
      );
      res.json(result[0]);
    } catch (error) {
       res.status(500).json({ error: error.message });
    }
  };

  // * Get dollar change by id
  static getDollarChangeById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const result = await connection.query(
        "select BIN_TO_UUID(id) as id, compra, venta, fecha_modificacion from cambio_dolar where BIN_TO_UUID(id) = ?;",
        [id]
      );

      res.json(result[0]);
    } catch (error) {
       res.status(500).json({ error: error.message });
    }
  };

  // *  Create new dollar change
  static createDollarChane = async (req: Request, res: Response) => {
    const brand = <dollarChangeInterface>req.body;

    const { 
        compra, 
        venta, 
        fecha_modificacion, 
        usuario_creador 
    } = brand;

    try {
      const userExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
        [usuario_creador]
      );
      const [{ idUser }] = userExists[0];
      if (idUser === 0) {
        const error = new Error("El usuario que esta creando este cambio de dolar, no existe...");
        return res.status(409).json({ error: error.message });
      }

      const marcaExists = await connection.query(
        "select count(compra and venta) as countDollarChange from cambio_dolar where compra = ? and venta = ?;",
        [compra, venta]
      );
      const [{ countDollarChange }] = marcaExists[0];
      if (countDollarChange === 1) {
        const error = new Error("Este cambio de dolar ya existen en la base de datos...");
        return res.status(409).json({ error: error.message });
      }

      const result = await connection.query(
        "insert into cambio_dolar (compra, venta, fecha_modificacion, usuario_creador) values (?, ?, now(), UUID_TO_BIN(?));",
        [compra, venta, usuario_creador]
      );

      res.send("Cambio de colar creado correctamente...");
    } catch (error) {
       res.status(500).json({ error: error.message });
    }
  };

  // * Update dollar change by id
  static updateDollarChange = async (req: Request, res: Response) => {
    const { id } = req.params;
    const dollaChange = <dollarChangeInterface>req.body;
    const {
      compra,
      venta,     
      usuario_modificador,
    } = dollaChange;

    try {
      const userExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
        [usuario_modificador]
      );
      const [{ idUser }] = userExists[0];
      if (idUser === 0) {
        const error = new Error("El usuario que esta editando esta marca no existe...");
        return res.status(409).json({ error: error.message });
      }

      const dollarChangeExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idDollarChange from cambio_dolar where BIN_TO_UUID(id) = ?;",
        [id]
      );
      const [{ idDollarChange }] = dollarChangeExists[0];
      if (idDollarChange === 0) {
        const error = new Error(
          "El cambio de dolar que estas buscando, no se encontro..."
        );
        return res.status(404).json({ error: error.message });
      }

      const valueNumberExists = await connection.query(
        "select count(compra, venta) as value from marca where compra = ? and venta = ? and BIN_TO_UUID(id) != ?;",
        [compra, venta, id]
      );
      const [{ value }] = valueNumberExists[0];
      if (value === 1) {
        const error = new Error(
          "Este cambio de dolar se encuentra registrada en la base de datos..."
        );
        return res.status(409).json({ error: error.message });
      }

      const result = await connection.query(
        "update cambio_dolar set compra = ?, venta = ?, fecha_modificacion = now(), usuario_modificador = UUID_TO_BIN(?) where BIN_TO_UUID(id) = ?;",
        [compra, venta, usuario_modificador, id]
      );

      res.send("El cambio de dolar se modifico correctamente...");
    } catch (error) {
       res.status(500).json({ error: error.message });
    }
  };

  // * Delete dollar change by id
  static deleteDollarChange = async (req: Request, res: Response) => {
    const { idDollarChange } = req.params;
    try {
      const existsDollarChange = await connection.query(
        "select count(BIN_TO_UUID(id)) as id from cambio_dolar where BIN_TO_UUID(id) = ?;",
        [idDollarChange]
      );
      const [{ id }] = existsDollarChange[0];

      if (id === 0) {
        const error = new Error(
          "El cambio de dolar que estas buscando, no se encontro..."
        );
        return res.status(404).json({ error: error.message });
      }

      await connection.query("delete from cambio_dolar where BIN_TO_UUID(id) = ?", [
        idDollarChange,
      ]);

      res.send("Cambio de dolar eliminado correctamente...");
    } catch (error) {
       res.status(500).json({ error: error.message });
    }
  };
}
