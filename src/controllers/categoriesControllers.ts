import type { Request, Response } from "express";
import { connection } from "../config/db";
import type {
  categoriesInterface
} from "../interface/valueInterface";

export class CategoriesControllers {
  // * Get alls categories
  static getAllCategories = async (req: Request, res: Response) => {
    try {
      const result = await connection.query(
        "select BIN_TO_UUID(c.id) as id, c.nombre_categoria, c.descripcion, c.estado, c.fecha_creacion, coalesce(uc.nombre_usuario, '') as nombre_usuario_creador, coalesce(um.nombre_usuario, '') as nombre_usuario_modificador from categoria c left join usuario uc on uc.id=c.usuario_creador left join usuario um on um.id=c.usuario_modificador;"
      );
      res.json(result[0]);
    } catch (error: any) {
       res.status(500).json({ error: error.message });
    }
  };

  // * Get category by id
  static getCategoriesById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const result = await connection.query(
        "select BIN_TO_UUID(id) as id, nombre_categoria, descripcion, estado, fecha_creacion from categoria where BIN_TO_UUID(id) = ?;",
        [id]
      );

      res.json(result[0]);
    } catch (error: any) {
       res.status(500).json({ error: error.message });
    }
  };

  // *  Create new category
  static createCategory = async (req: Request, res: Response) => {
    const category = <categoriesInterface>req.body;

    const {
      nombre_categoria,
      descripcion,
      estado,      
      usuario_creador,
    } = category;

    try {
      const userExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
        [usuario_creador]
      );
      const [{ idUser }] = (userExists as any)[0];
      if (idUser === 0) {
        const error = new Error("El usuario que esta intentando crear la categoría, no existe...");
        return res.status(409).json({ error: error.message });
      }

      const marcaExists = await connection.query(
        "select count(nombre_categoria) as valueCategoria from categoria where nombre_categoria = ?;",
        [nombre_categoria]
      );
      const [{ valueCategoria }] = (marcaExists as any)[0];
      if (valueCategoria === 1) {
        const error = new Error(
          "Esta categoría ya existen en la base de datos..."
        );
        return res.status(409).json({ error: error.message });
      }

      await connection.query(
        "insert into categoria (nombre_categoria, descripcion, estado, fecha_creacion, usuario_creador) values (?, ?, ?, now(), UUID_TO_BIN(?));",
        [nombre_categoria, descripcion, estado, usuario_creador]
      );

      res.send("Categoría creada correctamente...");
    } catch (error: any) {
       res.status(500).json({ error: error.message });
    }
  };

  // * Update brand by id
  static updateBrand = async (req: Request, res: Response) => {
    const { id } = req.params;
    const category = <categoriesInterface>req.body;
    const {
      nombre_categoria,
      descripcion,
      estado,      
      usuario_modificador,
    } = category;
    try {
      const userExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
        [usuario_modificador]
      );
      const [{ idUser }] = (userExists as any)[0];
      if (idUser === 0) {
        const error = new Error("El usuario que esta intentando editar la categoría, no existe...");
        return res.status(409).json({ error: error.message });
      }

      const brandExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idCategory from categoria where BIN_TO_UUID(id) = ?;",
        [id]
      );
      const [{ idCategory }] = (brandExists as  any)[0];
      if (idCategory === 0) {
        const error = new Error(
          "La categoría que estas buscando, no se encontro..."
        );
        return res.status(404).json({ error: error.message });
      }

      const nameBrandExists = await connection.query(
        "select count(nombre_categoria) as valueName from categoria where nombre_categoria = ? and BIN_TO_UUID(id) != ?;",
        [nombre_categoria, id]
      );
      const [{ valueName }] = (nameBrandExists as  any)[0];
      if (valueName === 1) {
        const error = new Error(
          "Esta categoría se encuentra registrada en la base de datos..."
        );
        return res.status(409).json({ error: error.message });
      }

      await connection.query(
        "update categoria set nombre_categoria = ?, descripcion = ?, estado = ?, fecha_modificacion = now(), usuario_modificador = UUID_TO_BIN(?) where BIN_TO_UUID(id) = ?;",
        [
          nombre_categoria,
          descripcion,
          estado,          
          usuario_modificador,
          id,
        ]
      );

      res.send("La categoría se modifico correctamente...");
    } catch (error: any) {
       res.status(500).json({ error: error.message });
    }
  };

  // * Delete category by id
  static deleteCategory = async (req: Request, res: Response) => {
    const { idCategory } = req.params;
    try {
      const exitstsBrand = await connection.query(
        "select count(BIN_TO_UUID(id)) as id from categoria where BIN_TO_UUID(id) = ?;",
        [idCategory]
      );
      const [{ id }] = (exitstsBrand as any)[0];

      if (id === 0) {
        const error = new Error(
          "La categoría que estas buscando, no se encontro..."
        );
        return res.status(404).json({ error: error.message });
      }

      await connection.query(
        "delete from categoria where BIN_TO_UUID(id) = ?",
        [idCategory]
      );

      res.send("Categoría eliminada correctamente...");
    } catch (error: any) {
       res.status(500).json({ error: error.message });
    }
  };
}
