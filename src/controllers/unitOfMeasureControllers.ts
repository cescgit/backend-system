import type { Request, Response } from "express";
import { connection } from "../config/db";
import { unitOfMeasureInterface } from "../interface/valueInterface";

export class unitOfMeasureControllers {
  // * Get Unit of measurements
  static getAllUnitOfMeasurements = async (req: Request, res: Response) => {
    try {
      const result = await connection.query(
        "select BIN_TO_UUID(ump.id) as id, ump.unidad_medida, ump.abreviatura, ump.fecha_creacion, coalesce(uc.nombre_usuario, '') as nombre_usuario_creador, coalesce(um.nombre_usuario, '') as nombre_usuario_modificador from unidad_medida ump left join usuario uc on uc.id=ump.usuario_creador left join usuario um on um.id=ump.usuario_modificador;"
      );
      res.json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // * Get Unit of measure by id
  static getUnitOfMeasureById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const result = await connection.query(
        "select BIN_TO_UUID(id) as id, unidad_medida, abreviatura, fecha_creacion from unidad_medida where BIN_TO_UUID(id) = ?;",
        [id]
      );

      res.json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // *  Create new Unit of measure
  static createUnitOfMeasure = async (req: Request, res: Response) => {
    const unitOfMeasure = <unitOfMeasureInterface>req.body;

    const {
      unidad_medida,
      abreviatura,           
      usuario_creador,
    } = unitOfMeasure;

    try {
      const userExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
        [usuario_creador]
      );
      const [{ idUser }] = (userExists as any)[0];

      if (idUser === 0) {
        const error = new Error("El usuario que esta intentando crear la unidad de medida, no existe...");
        return res.status(409).json({ error: error.message });
      }

      const unitOfMeasureValue = await connection.query(
        "select count(unidad_medida) as valueUnidadMedida from unidad_medida where unidad_medida = ?;",
        [unidad_medida]
      );
      const [{ valueUnidadMedida }] = (unitOfMeasureValue as any)[0];
      if (valueUnidadMedida === 1) {
        const error = new Error(
          "Esta unidad de medida ya existen en la base de datos..."
        );
        return res.status(409).json({ error: error.message });
      }

      const unitOfMeasureAbreviatura = await connection.query(
        "select count(abreviatura) as valueAbreviatura from unidad_medida where abreviatura = ?;",
        [abreviatura]
      );
      const [{ valueAbreviatura }] = (unitOfMeasureAbreviatura as any)[0];
      if (valueAbreviatura === 1) {
        const error = new Error(
          "Esta abreviatura ya existen en la base de datos..."
        );
        return res.status(409).json({ error: error.message });
      }

      const result = await connection.query(
        `insert into unidad_medida (unidad_medida, abreviatura, fecha_creacion, usuario_creador)
        values( ?, ?, now(), UUID_TO_BIN(?));`,
        [
          unidad_medida,
          abreviatura,          
          usuario_creador
        ]
      );

      res.send("Unidad de medida creada correctamente...");
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // * Update Unit of measure
  static updateUnitOfMeasure = async (req: Request, res: Response) => {
    const { id } = req.params;
    const unitOfMeasure = <unitOfMeasureInterface>req.body;
    const {
      unidad_medida,
      abreviatura,      
      usuario_modificador,
    } = unitOfMeasure;

    try {
      const userExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
        [usuario_modificador]
      );
      const [{ idUser }] = (userExists as any)[0];
      if (idUser === 0) {
        const error = new Error("El usuario que esta intentando editar la unidad de medida, no existe...");
        return res.status(409).json({ error: error.message });
      }

      const unitOfMeasureExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idUnitOfMeasure from unidad_medida where BIN_TO_UUID(id) = ?;",
        [id]
      );
      const [{ idUnitOfMeasure }] = (unitOfMeasureExists as any)[0];
      if (idUnitOfMeasure === 0) {
        const error = new Error(
          "La unidad de medida que estas buscando, no se encuentra en la base de datos..."
        );
        return res.status(404).json({ error: error.message });
      }

      const unidadMedidaExists = await connection.query(
        "select count(unidad_medida) as valueUnidadMedida from unidad_medida where unidad_medida = ? and BIN_TO_UUID(id) != ?;",
        [unidad_medida, id]
      );
      const [{ valueUnidadMedida }] = (unidadMedidaExists as any)[0];
      if (valueUnidadMedida === 1) {
        const error = new Error(
          "Esta unidad de medida se encuentra registrada en la base de datos..."
        );
        return res.status(409).json({ error: error.message });
      }

      const unitOfMeasureAbreviatura = await connection.query(
        "select count(abreviatura) as valueAbreviatura from unidad_medida where abreviatura = ?;",
        [abreviatura]
      );
      const [{ valueAbreviatura }] = (unitOfMeasureAbreviatura as any)[0];
      if (valueAbreviatura === 1) {
        const error = new Error(
          "Esta abreviatura ya existen en la base de datos..."
        );
        return res.status(409).json({ error: error.message });
      }

      const result = await connection.query(
        "update unidad_medida set unidad_medida = ?, abreviatura = ?, fecha_modificacion= now(), usuario_modificador = UUID_TO_BIN(?) where BIN_TO_UUID(id) = ?;",
        [
          unidad_medida,
          abreviatura,                  
          usuario_modificador,
          id,
        ]
      );

      res.send("La unidad de medida se modifico correctamente...");
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // * Delete tax by id
  static deleteUnitOfMeasure = async (req: Request, res: Response) => {
    const { idUnitOfMeasure } = req.params;
    try {
      const exitstsBrand = await connection.query(
        "select count(BIN_TO_UUID(id)) as id from unidad_medida where BIN_TO_UUID(id) = ?;",
        [idUnitOfMeasure]
      );
      const [{ id }] = (exitstsBrand as any)[0];

      if (id === 0) {
        const error = new Error(
          "La unidad de medida que estas buscando, no se encuentra en la base de datos..."
        );
        return res.status(404).json({ error: error.message });
      }

      await connection.query("delete from unidad_medida where BIN_TO_UUID(id) = ?", [
        idUnitOfMeasure,
      ]);

      res.send("Unidad de medida se ha eliminado correctamente...");
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
