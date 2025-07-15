import type { Request, Response } from "express";
import { connection } from "../config/db";
import { supplierInterface } from "../interface/valueInterface";

export class SupplierController {
  // * Get alls suppliers
  static getAllSuppliers = async (req: Request, res: Response) => {
    try {
      const result = await connection.query(
        "select BIN_TO_UUID(p.id) as id, LPAD(p.codigo_proveedor, 10, '0') as codigo_proveedor, p.nombre_proveedor, p.direccion_proveedor, p.correo_proveedor, p.telefono_proveedor, p.celular_proveedor, p.ruc, p.contacto, p.estado, p.termino_compra, p.fecha_creacion, coalesce(uc.nombre_usuario, '') as nombre_usuario_creador, coalesce(um.nombre_usuario, '') as nombre_usuario_modificador from proveedor p left join usuario uc on uc.id=p.usuario_creador left join usuario um on um.id=p.usuario_modificador order by p.codigo_proveedor desc;"
      );
      res.json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // * Get supplier by id
  static getSupplierById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const result = await connection.query(
        "select BIN_TO_UUID(id) as id, LPAD(codigo_proveedor, 10, '0') as codigo_proveedor, nombre_proveedor, direccion_proveedor, correo_proveedor, telefono_proveedor, celular_proveedor, ruc, contacto, estado, termino_compra, fecha_creacion from proveedor where BIN_TO_UUID(id) = ?;",
        [id]
      );

      res.json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // *  Create new supplier
  static createSupplier = async (req: Request, res: Response) => {
    const supplier = <supplierInterface>req.body;

    const {      
      nombre_proveedor,
      direccion_proveedor,
      correo_proveedor,
      telefono_proveedor,
      celular_proveedor,
      ruc,
      contacto,
      estado,      
      termino_compra,
      usuario_creador,
    } = supplier;

    try {
      const userExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
        [usuario_creador]
      );
      const [{ idUser }] = (userExists as any)[0];
      if (idUser === 0) {
        const error = new Error("El usuario que esta intentando guardar este registro no existe en la base de datos");
        return res.status(409).json({ error: error.message });
      }

      const supplierExists = await connection.query(
        "select count(nombre_proveedor) as valueSupplier from proveedor where nombre_proveedor = ?;",
        [nombre_proveedor]
      );
      const [{ valueSupplier }] = (supplierExists as any)[0];
      if (valueSupplier === 1) {
        const error = new Error(
          "Este proveedor ya existen en la base de datos..."
        );
        return res.status(409).json({ error: error.message });
      }

      const result = await connection.query(
        "insert into proveedor (nombre_proveedor, direccion_proveedor, correo_proveedor, telefono_proveedor, celular_proveedor, ruc,contacto, estado, termino_compra, fecha_creacion, usuario_creador)values(?, ?, ?, ?, ?, ?, ?, ?, ?,  now(), UUID_TO_BIN(?));",
        [          
          nombre_proveedor,
          direccion_proveedor,
          correo_proveedor,
          telefono_proveedor,
          celular_proveedor,
          ruc,
          contacto,
          estado,          
          termino_compra,
          usuario_creador
        ]
      );

      res.send("El proveedor se creo correctamente...");
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // * Update supplier by id
  static updateSupplier = async (req: Request, res: Response) => {
    const { id } = req.params;
    const supplier = <supplierInterface>req.body;

    const {      
      nombre_proveedor,
      direccion_proveedor,
      correo_proveedor,
      telefono_proveedor,
      celular_proveedor,
      ruc,
      contacto,
      estado,      
      termino_compra,   
      usuario_modificador
    } = supplier;

    try {
      const userExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
        [usuario_modificador]
      );
      const [{ idUser }] = (userExists as any)[0];
      if (idUser === 0) {
        const error = new Error("El usuario que esta intentando modificar este registro no existe en la base de datos");
        return res.status(409).json({ error: error.message });
      }

      const supplierTypeValueExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idSupplier from proveedor where BIN_TO_UUID(id) = ?;",
        [id]
      );
      const [{ idSupplier }] = (supplierTypeValueExists as any)[0];
      if (idSupplier === 0) {
        const error = new Error(
          "El proveedor que estas buscando, no se encontro..."
        );
        return res.status(404).json({ error: error.message });
      }

      const supplierExists = await connection.query(
        "select count(nombre_proveedor) as valueNombreProveedor from proveedor where nombre_proveedor = ? and BIN_TO_UUID(id) != ?;",
        [nombre_proveedor, id]
      );
      const [{ valueNombreProveedor }] = (supplierExists as any)[0];
      if (valueNombreProveedor === 1) {
        const error = new Error(
          "El proveedor se encuentra registrado en la base de datos..."
        );
        return res.status(409).json({ error: error.message });
      }

      const result = await connection.query(
        "update proveedor set nombre_proveedor = ?, direccion_proveedor = ?, correo_proveedor = ?, telefono_proveedor = ?,  celular_proveedor = ?, ruc = ?, contacto = ?, estado = ?, termino_compra = ?, fecha_modificacion = now(), usuario_modificador = UUID_TO_BIN(?) where BIN_TO_UUID(id) = ?;",
        [          
          nombre_proveedor,
          direccion_proveedor,
          correo_proveedor,
          telefono_proveedor,
          celular_proveedor,
          ruc,
          contacto,
          estado,
          termino_compra,
          usuario_modificador,
          id
        ]
      );

      res.send("El proveedor se modifico correctamente...");
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // * Delete supplier by id
  static deleteSupplier = async (req: Request, res: Response) => {
    const { idSupplier } = req.params;
    try {
      const existsSupplier = await connection.query(
        "select count(BIN_TO_UUID(id)) as id from proveedor where BIN_TO_UUID(id) = ?;",
        [idSupplier]
      );
      const [{ id }] = (existsSupplier as any)[0];

      if (id === 0) {
        const error = new Error(
          "La categoría del proveedor que estas buscando, no se encontro..."
        );
        return res.status(404).json({ error: error.message });
      }

      await connection.query(
        "delete from proveedor where BIN_TO_UUID(id) = ?",
        [idSupplier]
      );

      res.send("El proveedor se elimino correctamente...");
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
