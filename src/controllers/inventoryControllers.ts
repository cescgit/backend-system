import type { Request, Response } from "express";
import { connection } from "../config/db";
import type {
  brandInterface
} from "../interface/valueInterface";

export class InventoryController {
  // * Get all inventory data
  static getAllInventory = async (req: Request, res: Response) => {
    try {
      const result = await connection.query(
        "select BIN_TO_UUID(i.id) as id_inventario, p.codigo, p.sac, BIN_TO_UUID(i.id_producto) as id_producto, p.nombre_producto, p.imagen_url, p.precio_compra, p.utilidad1, p.utilidad2, p.utilidad3, p.utilidad4, p.precio1, p.precio2, p.precio3, p.precio4, coalesce(i.cantidad_remision, '0') as remisiones, coalesce(i.cantidad_apartado, '0') as producto_apartado, i.stock, u.unidad_medida, c.nombre_categoria, m.nombre_marca, p.estado from inventario i inner join  producto p on p.id=i.id_producto inner join  marca m on m.id=p.id_marca inner join categoria c on c.id=p.id_categoria inner join unidad_medida u on u.id=p.id_unidad_medida;"
      );
      res.json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
