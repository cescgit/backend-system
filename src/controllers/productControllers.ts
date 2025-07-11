import type { Request, Response } from "express";
import { connection } from "../config/db";
import type { productsInterface } from "../interface/valueInterface";

export class ProductControllers {
  // * Get alls products
  static getAllProducts = async (req: Request, res: Response) => {
    try {
      const result = await connection.query(
        "select BIN_TO_UUID(p.id) as id, p.codigo, p.sac, p.nombre_producto, p.descripcion_producto, p.precio_compra, p.precio_venta_promedio,  p.cantidad, p.cantidad_minima, p.imagen_url, p.estado, p.expiracion, p.fecha_expiracion, p.pesoValor,  p.precio1, p.utilidad1, p.precio2, p.utilidad2, p.precio3, p.utilidad3, p.precio4, p.utilidad4, p.fecha_creacion,  BIN_TO_UUID(p.id_unidad_medida) as id_unidad_medida, BIN_TO_UUID(p.id_peso) as id_peso, BIN_TO_UUID(p.id_marca) as id_marca, m.nombre_marca as marca, BIN_TO_UUID(p.id_categoria) as id_categoria, c.nombre_categoria as categoria, coalesce(uc.nombre_usuario, '') as nombre_usuario_creador, coalesce(um.nombre_usuario, '') as nombre_usuario_modificador from producto p inner join  marca m on m.id=p.id_marca inner join  categoria c on c.id=p.id_categoria left join usuario uc on uc.id=p.usuario_creador left join usuario um on um.id=p.usuario_modificador order by p.fecha_creacion desc;"
      );
      res.json(result[0]);
    } catch (error) {      
      res.status(500).json({ error: error.message });
    }
  };

  // * Get product by id
  static getProductById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const result = await connection.query(
        "select BIN_TO_UUID(p.id) as id, p.codigo, p.sac, p.nombre_producto, p.descripcion_producto, p.precio_compra, p.precio_venta_promedio,  p.cantidad, p.cantidad_minima, p.imagen_url, p.estado, p.expiracion, p.fecha_expiracion, p.pesoValor, pe.peso,  p.precio1, p.utilidad1, p.precio2, p.utilidad2, p.precio3, p.utilidad3, p.precio4, p.utilidad4, p.fecha_creacion,  BIN_TO_UUID(p.id_unidad_medida) as id_unidad_medida, BIN_TO_UUID(p.id_peso) as id_peso, BIN_TO_UUID(p.id_marca) as id_marca, m.nombre_marca as marca, BIN_TO_UUID(p.id_categoria) as id_categoria, c.nombre_categoria as categoria  from producto p inner join  marca m on m.id=p.id_marca inner join  categoria c on c.id=p.id_categoria inner join peso pe on pe.id=p.id_peso where BIN_TO_UUID(p.id) = ?;",
        [id]
      );

      res.json(result[0]);
    } catch (error) {      
      res.status(500).json({ error: error.message });
    }
  };

  // *  Create new product
  static createProduct = async (req: Request, res: Response) => {
    const products = <productsInterface>req.body;

    const {
      codigo,
      sac,
      nombre_producto,
      descripcion_producto,
      precio_compra,
      cantidad,
      cantidad_minima,
      imagen_url,
      estado,
      expiracion,
      fecha_expiracion,    
      pesoValor,
      precio1,
      utilidad1,
      precio2,
      utilidad2,
      precio3,
      utilidad3,
      precio4,
      utilidad4,
      id_unidad_medida,      
      id_peso,
      id_marca,
      id_categoria,
      usuario_creador,
    } = products;

    try {
      const idExist = await connection.query(
        "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
        [usuario_creador]
      );
      const [{ valueId }] = idExist[0];

      if (valueId === 0) {
        const error = new Error("El usuario que esta intentando crear el producto, no existe...");
        return res.status(409).json({ error: error.message });
      }

      const codeExists = await connection.query(
        "select count(codigo) as valueCode from producto where codigo = ? and BIN_TO_UUID(id);",
        [codigo]
      );
      const [{ valueCode }] = codeExists[0];
      if (valueCode === 1) {
        const error = new Error(
          "Este producto ya existen en la base de datos..."
        );
        return res.status(409).json({ error: error.message });
      }

      const sacExists = await connection.query(
        "select count(sac) as sacCode from producto where codigo = ?;",
        [sac]
      );
      const [{ sacCode }] = sacExists[0];
      if (sacCode === 1) {
        const error = new Error(
          "El código sac ya existen en la base de datos..."
        );
        return res.status(409).json({ error: error.message });
      }

      const brandActive = await connection.query("select estado as stateBrand from marca where BIN_TO_UUID(id) = ?",
        [id_marca]
      );
      const [{ stateBrand }] = brandActive;
      if (stateBrand === 0) {
        const error = new Error(
          "No puedes seleccionar una marca Inactiva..."
        );
        return res.status(409).json({ error: error.message });
      }

      const categoryActive = await connection.query("select estado as stateCategory from categoria where BIN_TO_UUID(id) = ?",
        [id_categoria]
      );
      const [{ stateCategory }] = categoryActive;
      if (stateCategory === 0) {
        const error = new Error(
          "No puedes seleccionar una categoría Inactiva..."
        );
        return res.status(409).json({ error: error.message });
      }

      const result = await connection.query(
        "insert into producto (codigo, sac, nombre_producto, descripcion_producto, precio_compra, cantidad, cantidad_minima, imagen_url, estado, expiracion, fecha_expiracion, pesoValor, precio1, utilidad1, precio2, utilidad2, precio3, utilidad3, precio4, utilidad4, fecha_creacion, id_unidad_medida, id_peso, id_marca, id_categoria, usuario_creador) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?));",
        [
          codigo,
          sac,
          nombre_producto,
          descripcion_producto,
          precio_compra,
          cantidad,
          cantidad_minima,
          imagen_url,
          estado,
          expiracion,
          fecha_expiracion,          
          pesoValor,
          precio1,
          utilidad1,
          precio2,
          utilidad2,
          precio3,
          utilidad3,
          precio4,
          utilidad4,
          id_unidad_medida,          
          id_peso,
          id_marca,
          id_categoria,
          usuario_creador
        ]
      );

      res.send("Producto creado correctamente");
    } catch (error) {      
      res.status(500).json({ error: error.message });
    }
  };

  // * Update user by id
  static updateProduct = async (req: Request, res: Response) => {
    const { id } = req.params;
    const products = <productsInterface>req.body;

    const {
      codigo,
      sac,
      nombre_producto,
      descripcion_producto,
      precio_compra,
      cantidad,
      cantidad_minima,
      imagen_url,
      expiracion,
      fecha_expiracion,      
      pesoValor,
      estado,
      precio1,
      utilidad1,
      precio2,
      utilidad2,
      precio3,
      utilidad3,
      precio4,
      utilidad4,
      id_unidad_medida,
      id_peso,      
      id_marca,
      id_categoria,
      usuario_modificador
    } = products;    

    try {
      const idExist = await connection.query(
        "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
        [usuario_modificador]
      );
      const [{ idUser }] = idExist[0];
      if (idUser === 0) {
        const error = new Error("El usuario que esta intentanto modificar el producto, no existe...");
        return res.status(409).json({ error: error.message });
      }

      const codeExists = await connection.query(
        "select count(codigo) as valueCode from producto where codigo = ? and BIN_TO_UUID(id) != ?;",
        [codigo, id]
      );
      const [{ valueCode }] = codeExists[0];
      if (valueCode === 1) {
        const error = new Error(
          "Este producto ya existen en la base de datos..."
        );
        return res.status(409).json({ error: error.message });
      }

      const sacExists = await connection.query(
        "select count(sac) as sacCode from producto where sac = ? and BIN_TO_UUID(id) != ?;",
        [sac, id]
      );      
      const [{ sacCode }] = sacExists[0];
      if (sacCode === 1) {
        const error = new Error(
          "El código sac ya existen en la base de datos..."
        );
        return res.status(409).json({ error: error.message });
      }

      const brandActive = await connection.query("select estado as stateBrand from marca where BIN_TO_UUID(id) = ?",
        [id_marca]
      );
      const [{ stateBrand }] = brandActive;
      if (stateBrand === 0) {
        const error = new Error(
          "No puedes seleccionar una marca Inactiva..."
        );
        return res.status(409).json({ error: error.message });
      }

      const categoryActive = await connection.query("select estado as stateCategory from categoria where BIN_TO_UUID(id) = ?",
        [id_categoria]
      );
      const [{ stateCategory }] = categoryActive;
      if (stateCategory === 0) {
        const error = new Error(
          "No puedes seleccionar una categoría Inactiva..."
        );
        return res.status(409).json({ error: error.message });
      }

      const result = await connection.query(
        "update producto set codigo = ?, sac = ?, nombre_producto = ?, descripcion_producto = ?, precio_compra = ?, cantidad = ?, cantidad_minima = ?, imagen_url = ?, estado = ?, expiracion = ?, fecha_expiracion = ?, pesoValor = ?,  precio1 = ?, utilidad1 = ?, precio2 = ?, utilidad2 = ?, precio3 = ?, utilidad3 = ?, precio4 = ?, utilidad4 = ?, fecha_modificacion = now(), id_unidad_medida = UUID_TO_BIN(?), id_peso = UUID_TO_BIN(?), id_marca = UUID_TO_BIN(?), id_categoria = UUID_TO_BIN(?), usuario_modificador = UUID_TO_BIN(?) where BIN_TO_UUID(id) = ?;",
        [
          codigo,
          sac,
          nombre_producto,
          descripcion_producto,
          precio_compra,
          cantidad,
          cantidad_minima,
          imagen_url,
          estado,
          expiracion,
          fecha_expiracion,          
          pesoValor,
          precio1,
          utilidad1,
          precio2,
          utilidad2,
          precio3,
          utilidad3,
          precio4,
          utilidad4,
          id_unidad_medida,          
          id_peso,
          id_marca,
          id_categoria,
          usuario_modificador,
          id,
        ]
      );

      res.send("Producto modificado correctamente...");
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // * Delete product by id
  static deleteProduct = async (req: Request, res: Response) => {
    const { idProduct } = req.params;
    try {
      const existsProducto = await connection.query(
        "select count(BIN_TO_UUID(id)) as id from producto where BIN_TO_UUID(id) = ?;",
        [idProduct]
      );
      const [{ id }] = existsProducto[0];
      if (id === 0) {
        const error = new Error(
          "El producto que estas buscando, no se encontro..."
        );
        return res.status(404).json({ error: error.message });
      }

      const existsProductInventory = await connection.query(
        "select count(BIN_TO_UUID(id_producto)) as existsProduct from inventario where BIN_TO_UUID(id_producto) = ?;",
        [idProduct]
      );
      const [{ existsProduct }] = existsProductInventory[0];
      if (existsProduct === 1) {
        const error = new Error(
          "El producto no se puede eliminar ya que dispones en el inventario..."
        );
        return res.status(404).json({ error: error.message });
      }

      await connection.query(
        "delete from producto where BIN_TO_UUID(id) = ?",
        [idProduct]
      );

      res.send("Producto eliminado correctamente...");
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}
