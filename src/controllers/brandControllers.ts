import type { Request, Response } from "express";
import { connection } from "../config/db";
import type {
  brandInterface
} from "../interface/valueInterface";

export class BrandController {
  // * Get alls brands
  static getAllBrands = async (req: Request, res: Response) => {
    try {
      const result = await connection.query(
        "select BIN_TO_UUID(m.id) as id, m.nombre_marca, m.descripcion, m.estado, m.fecha_creacion, coalesce(uc.nombre_usuario, '') as nombre_usuario_creador, coalesce(um.nombre_usuario, '') as nombre_usuario_modificador from marca m left join usuario uc on uc.id=m.usuario_creador left join usuario um on um.id=m.usuario_modificador;"
      );
      res.json(result[0]);
    } catch (error) {
       res.status(500).json({ error: error.message });
    }
  };

  // * Get sser by id
  static getBrandById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const result = await connection.query(
        "select BIN_TO_UUID(id) as id, nombre_marca, descripcion, estado, fecha_creacion from marca where BIN_TO_UUID(id) = ?;",
        [id]
      );

      res.json(result[0]);
    } catch (error) {
       res.status(500).json({ error: error.message });
    }
  };

  // *  Create new brand
  static createBrand = async (req: Request, res: Response) => {
    const brand = <brandInterface>req.body;

    const { nombre_marca, descripcion, estado, usuario_creador } =
      brand;

    try {
      const userExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
        [usuario_creador]
      );
      const [{ idUser }] = userExists[0];
      if (idUser === 0) {
        const error = new Error("El usuario que esta creando esta marca, no existe...");
        return res.status(409).json({ error: error.message });
      }

      const marcaExists = await connection.query(
        "select count(nombre_marca) as valueMarca from marca where nombre_marca = ?;",
        [nombre_marca]
      );
      const [{ valueMarca }] = marcaExists[0];
      if (valueMarca === 1) {
        const error = new Error("Esta marca ya existen en la base de datos...");
        return res.status(409).json({ error: error.message });
      }

      const result = await connection.query(
        "insert into marca (nombre_marca, descripcion, estado, usuario_creador, fecha_creacion) values (?, ?, ?, UUID_TO_BIN(?), now());",
        [nombre_marca, descripcion, estado, usuario_creador]
      );

      res.send("Marca creada correctamente...");
    } catch (error) {
       res.status(500).json({ error: error.message });
    }
  };

  // * Update brand by id
  static updateBrand = async (req: Request, res: Response) => {
    const { id } = req.params;
    const brand = <brandInterface>req.body;
    const {
      nombre_marca,
      descripcion,
      estado,      
      usuario_modificador,
    } = brand;
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

      const brandExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idBrand from marca where BIN_TO_UUID(id) = ?;",
        [id]
      );
      const [{ idBrand }] = brandExists[0];
      if (idBrand === 0) {
        const error = new Error(
          "La marca que estas buscando, no se encontro..."
        );
        return res.status(404).json({ error: error.message });
      }

      const nameBrandExists = await connection.query(
        "select count(nombre_marca) as valueName from marca where nombre_marca = ? and BIN_TO_UUID(id) != ?;",
        [nombre_marca, id]
      );
      const [{ valueName }] = nameBrandExists[0];
      if (valueName === 1) {
        const error = new Error(
          "Este marca se encuentra registrada en la base de datos..."
        );
        return res.status(409).json({ error: error.message });
      }

      await connection.query(
        "update marca set nombre_marca = ?, descripcion = ?, estado = ?, fecha_modificacion = now(), usuario_modificador = UUID_TO_BIN(?) where BIN_TO_UUID(id) = ?;",
        [nombre_marca, descripcion, estado, usuario_modificador, id]
      );

      res.send("La marca se modifico correctamente...");
    } catch (error) {
       res.status(500).json({ error: error.message });
    }
  };

  // * Delete brand by id
  static deleteBrand = async (req: Request, res: Response) => {
    const { idBrand } = req.params;
    try {
      const exitstsBrand = await connection.query(
        "select count(BIN_TO_UUID(id)) as id from marca where BIN_TO_UUID(id) = ?;",
        [idBrand]
      );
      const [{ id }] = exitstsBrand[0];

      if (id === 0) {
        const error = new Error(
          "La marca que estas buscando, no se encontro..."
        );
        return res.status(404).json({ error: error.message });
      }

      await connection.query("delete from marca where BIN_TO_UUID(id) = ?", [
        idBrand,
      ]);

      res.send("Marca eliminada correctamente...");
    } catch (error) {
       res.status(500).json({ error: error.message });
    }
  };
}
