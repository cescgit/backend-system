import type { Request, Response } from "express";
import { connection } from "../config/db";
import { weightInterface } from "../interface/valueInterface";

export class weightControllers {
  // * Get all weight
  static getAllWeight = async (req: Request, res: Response) => {
    try {
      const result = await connection.query(
        "select BIN_TO_UUID(p.id) as id, p.peso, p.abreviatura, p.fecha_creacion, coalesce(uc.nombre_usuario, '') as nombre_usuario_creador, coalesce(um.nombre_usuario, '') as nombre_usuario_modificador from peso p left join usuario uc on uc.id=p.usuario_creador left join usuario um on um.id=p.usuario_modificador;"
      );
      res.json(result[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // * Get Unit of measure by id
  static getWeightById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const result = await connection.query(
        "select BIN_TO_UUID(id) as id, peso, abreviatura, fecha_creacion from peso where BIN_TO_UUID(id) = ?;",
        [id]
      );

      res.json(result[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // *  Create new Unit of measure
  static createWeight = async (req: Request, res: Response) => {
    const weight = <weightInterface>req.body;

    const {
      peso,
      abreviatura,           
      usuario_creador,
    } = weight;

    try {
      const userExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
        [usuario_creador]
      );
      const [{ idUser }] = userExists[0];

      if (idUser === 0) {
        const error = new Error("El usuario que esta intentando crear la unidad de medida, no existe...");
        return res.status(409).json({ error: error.message });
      }

      const weightData = await connection.query(
        "select count(peso) as weightValue from peso where peso = ?;",
        [peso]
      );
      const [{ weightValue }] = weightData[0];
      if (weightValue === 1) {
        const error = new Error(
          "Este peso ya existen en la base de datos..."
        );
        return res.status(409).json({ error: error.message });
      }

      const weightAbreviatura = await connection.query(
        "select count(abreviatura) as valueAbreviatura from peso where abreviatura = ?;",
        [abreviatura]
      );
      const [{ valueAbreviatura }] = weightAbreviatura[0];
      if (valueAbreviatura === 1) {
        const error = new Error(
          "Esta abreviatura ya existen en la base de datos..."
        );
        return res.status(409).json({ error: error.message });
      }

      const result = await connection.query(
        `insert into peso (peso, abreviatura, fecha_creacion, usuario_creador)
        values( ?, ?, now(), UUID_TO_BIN(?));`,
        [
          peso,
          abreviatura,          
          usuario_creador
        ]
      );

      res.send("El peso se creo correctamente...");
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // * Update weight by id
  static updateWeight = async (req: Request, res: Response) => {
    const { id } = req.params;
    const weight = <weightInterface>req.body;
    const {
      peso,
      abreviatura,      
      usuario_modificador,
    } = weight;

    try {
      const userExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
        [usuario_modificador]
      );
      const [{ idUser }] = userExists[0];
      if (idUser === 0) {
        const error = new Error("El usuario que esta intentando modificar el peso no existe en la base de datos...");
        return res.status(409).json({ error: error.message });
      }

      const weightExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idWeight from peso where BIN_TO_UUID(id) = ?;",
        [id]
      );
      const [{ idWeight }] = weightExists[0];
      if (idWeight === 0) {
        const error = new Error(
          "El peso que estas buscando, no se encuentra en la base de datos..."
        );
        return res.status(404).json({ error: error.message });
      }

      const weightData = await connection.query(
        "select count(peso) as valueWeight from peso where peso = ? and BIN_TO_UUID(id) != ?;",
        [peso, id]
      );
      const [{ valueWeight }] = weightData[0];
      if (valueWeight === 1) {
        const error = new Error(
          "Este peso se encuentra registrado en la base de datos..."
        );
        return res.status(409).json({ error: error.message });
      }

      const weightAbreviatura = await connection.query(
        "select count(abreviatura) as valueAbreviatura from peso where abreviatura = ?;",
        [abreviatura]
      );
      const [{ valueAbreviatura }] = weightAbreviatura[0];
      if (valueAbreviatura === 1) {
        const error = new Error(
          "Esta abreviatura ya existen en la base de datos..."
        );
        return res.status(409).json({ error: error.message });
      }

      const result = await connection.query(
        "update peso set peso = ?, abreviatura = ?, fecha_modificacion= now(), usuario_modificador = UUID_TO_BIN(?) where BIN_TO_UUID(id) = ?;",
        [
          peso,
          abreviatura,                  
          usuario_modificador,
          id,
        ]
      );

      res.send("El peso se modifico correctamente...");
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // * Delete weight by id
  static deleteWeight = async (req: Request, res: Response) => {
    const { idWeight } = req.params;
    try {
      const existsWeight = await connection.query(
        "select count(BIN_TO_UUID(id)) as id from peso where BIN_TO_UUID(id) = ?;",
        [idWeight]
      );
      const [{ id }] = existsWeight[0];

      if (id === 0) {
        const error = new Error(
          "El peso que estas buscando, no se encuentra en la base de datos..."
        );
        return res.status(404).json({ error: error.message });
      }

      await connection.query("delete from peso where BIN_TO_UUID(id) = ?", [
        idWeight,
      ]);

      res.send("El peso se ha eliminado correctamente...");
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}
