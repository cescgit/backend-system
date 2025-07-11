import type { Request, Response } from "express";
import { connection } from "../config/db";
import { taxesInterface } from "../interface/valueInterface";

export class TaxesController {
  // * Get alls taxes
  static getAllTaxes = async (req: Request, res: Response) => {
    try {
      const result = await connection.query(
        "select BIN_TO_UUID(id) as id, abreviatura, descripcion, valor_porcentaje, valor_cantidad, fecha_creacion from impuesto;"
      );
      res.json(result[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // * Get tax by id
  static getTaxesById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const result = await connection.query(
        "select BIN_TO_UUID(id) as id, abreviatura, descripcion, valor_porcentaje, valor_cantidad, fecha_creacion from impuesto where BIN_TO_UUID(id) = ?;",
        [id]
      );

      res.json(result[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // *  Create new tax
  static createTax = async (req: Request, res: Response) => {
    const tax = <taxesInterface>req.body;

    const {
      abreviatura,
      descripcion,
      valor_porcentaje,
      valor_cantidad,      
      usuario_creador,
    } = tax;

    try {
      const userExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
        [usuario_creador]
      );
      const [{ idUser }] = userExists[0];

      if (idUser === 0) {
        const error = new Error("El usuario que esta intentando crear el impuesto, no existe...");
        return res.status(409).json({ error: error.message });
      }

      const taxesValue = await connection.query(
        "select count(abreviatura) as valueTax from impuesto where abreviatura = ?;",
        [abreviatura]
      );
      const [{ valueTax }] = taxesValue[0];
      if (valueTax === 1) {
        const error = new Error(
          "Este impuesto ya existen en la base de datos..."
        );
        return res.status(409).json({ error: error.message });
      }

      const result = await connection.query(
        `insert into impuesto (abreviatura, descripcion, valor_porcentaje, valor_cantidad, fecha_creacion, usuario_creador)
        values( ?, ?, ?, ?, now(), UUID_TO_BIN(?));`,
        [
          abreviatura,
          descripcion,
          valor_porcentaje,
          valor_cantidad,          
          usuario_creador
        ]
      );

      res.send("Impuesto creado correctamente...");
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // * Update tax by id
  static updateTax = async (req: Request, res: Response) => {
    const { id } = req.params;
    const tax = <taxesInterface>req.body;
    const {
      abreviatura,
      descripcion,
      valor_porcentaje,
      valor_cantidad,      
      usuario_modificador,
    } = tax;

    try {
      const userExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
        [usuario_modificador]
      );
      const [{ idUser }] = userExists[0];
      if (idUser === 0) {
        const error = new Error("El usuario que esta intentando editar el impuesto, no existe...");
        return res.status(409).json({ error: error.message });
      }

      const taxExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idTax from impuesto where BIN_TO_UUID(id) = ?;",
        [id]
      );
      const [{ idTax }] = taxExists[0];
      if (idTax === 0) {
        const error = new Error(
          "El impuesto que estas buscando, no se encontro..."
        );
        return res.status(404).json({ error: error.message });
      }

      const abreviaturaTaxExists = await connection.query(
        "select count(abreviatura) as valueName from impuesto where abreviatura = ? and BIN_TO_UUID(id) != ?;",
        [abreviatura, id]
      );
      const [{ valueName }] = abreviaturaTaxExists[0];
      if (valueName === 1) {
        const error = new Error(
          "Este impuesto se encuentra registrado en la base de datos..."
        );
        return res.status(409).json({ error: error.message });
      }

      const result = await connection.query(
        "update impuesto set abreviatura = ?, descripcion = ?, valor_porcentaje = ?, valor_cantidad = ?, fecha_modificacion= now(), usuario_modificador = UUID_TO_BIN(?) where BIN_TO_UUID(id) = ?;",
        [
          abreviatura,
          descripcion,
          valor_porcentaje,
          valor_cantidad,          
          usuario_modificador,
          id,
        ]
      );

      res.send("El impuesto se modifico correctamente...");
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // * Delete tax by id
  static deleteTaxes = async (req: Request, res: Response) => {
    const { idTax } = req.params;
    try {
      const exitstsBrand = await connection.query(
        "select count(BIN_TO_UUID(id)) as id from impuesto where BIN_TO_UUID(id) = ?;",
        [idTax]
      );
      const [{ id }] = exitstsBrand[0];

      if (id === 0) {
        const error = new Error(
          "El impuesto que estas buscando, no se encontro..."
        );
        return res.status(404).json({ error: error.message });
      }

      await connection.query("delete from impuesto where BIN_TO_UUID(id) = ?", [
        idTax,
      ]);

      res.send("Impuesto eliminado correctamente...");
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}
