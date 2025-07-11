import type { Request, Response } from "express";
import { connection } from "../config/db";
import { customerInterface } from "../interface/valueInterface";

export class CustomerTypeController {
  // * Get alls customer
  static getAllCustomer = async (req: Request, res: Response) => {
    try {
      const result = await connection.query(
        "select BIN_TO_UUID(c.id) as id, LPAD(c.codigo_cliente, 10, '0') AS codigo_cliente, c.cedula_cliente, c.nombre_cliente, c.telefono_cliente, c.celular_cliente, c.correo_cliente, c.direccion_cliente, c.ruc, c.contacto, c.estado, c.termino_venta, c.limite_credito, c.fecha_creacion, c.fecha_modificacion, BIN_TO_UUID(c.usuario_creador) as usuario_creador, BIN_TO_UUID(c.usuario_modificador) as usuario_modificador, coalesce(uc.nombre_usuario, '') as nombre_usuario_creador, coalesce(um.nombre_usuario, '') as nombre_usuario_modificador from cliente c left join usuario uc on uc.id=c.usuario_creador left join usuario um on um.id=c.usuario_modificador order by codigo_cliente desc;"
      );
      res.json(result[0]);
    } catch (error) {
       res.status(500).json({ error: error.message });
    }
  };

  // * Get customer  by id
  static geCustomerById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const result = await connection.query(
        "select BIN_TO_UUID(id) as id, LPAD(codigo_cliente, 10, '0') AS codigo_cliente, cedula_cliente, nombre_cliente, telefono_cliente, celular_cliente, correo_cliente, direccion_cliente, ruc, contacto, estado, termino_venta, limite_credito, fecha_creacion, fecha_modificacion, BIN_TO_UUID(usuario_creador) as usuario_creador, BIN_TO_UUID(usuario_modificador) as usuario_modificador from cliente where BIN_TO_UUID(id) = ?;",
        [id]
      );

      res.json(result[0]);
    } catch (error) {
       res.status(500).json({ error: error.message });
    }
  };

  // *  Create new customer
  static createCustomer = async (req: Request, res: Response) => {
    const customer = <customerInterface>req.body;

    const {      
      cedula_cliente,
      nombre_cliente,
      telefono_cliente,
      celular_cliente,
      correo_cliente,
      direccion_cliente,
      ruc,
      contacto,
      estado,
      termino_venta,
      limite_credito,      
      usuario_creador
    } = customer;

    try {
      const userExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
        [usuario_creador]
      );
      const [{ idUser }] = userExists[0];
      if (idUser === 0) {
        const error = new Error("El usuario que esta intentando guardar el cliente no existe ne la base de datos");
        return res.status(409).json({ error: error.message });
      }

      const supplierExists = await connection.query(
        "select count(nombre_cliente) as nameExists from cliente where nombre_cliente = ?;",
        [nombre_cliente]
      );
      const [{ nameExists }] = supplierExists[0];
      if (nameExists === 1) {
        const error = new Error(
          "Este cliente ya existen en la base de datos..."
        );
        return res.status(409).json({ error: error.message });
      }

      const result = await connection.query(
        "insert into cliente (cedula_cliente, nombre_cliente, telefono_cliente, celular_cliente, correo_cliente, direccion_cliente, ruc, contacto, estado, termino_venta, limite_credito, fecha_creacion, usuario_creador) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), UUID_TO_BIN(?));",
        [          
          cedula_cliente,
          nombre_cliente,
          telefono_cliente,
          celular_cliente,
          correo_cliente,
          direccion_cliente,
          ruc,
          contacto,
          estado,
          termino_venta,
          limite_credito,    
          usuario_creador,          
        ]
      );

      res.send("Cliente creado correctamente...");
    } catch (error) {
       res.status(500).json({ error: error.message });
    }
  };

  // * Update supplier  by id
  static updateCustomer = async (req: Request, res: Response) => {
    const { id } = req.params;
    const customer = <customerInterface>req.body;

        const {          
          cedula_cliente,
          nombre_cliente,
          telefono_cliente,
          celular_cliente,
          correo_cliente,
          direccion_cliente,
          ruc,
          contacto,
          estado,
          termino_venta,
          limite_credito,                
          usuario_modificador
        } = customer;

    try {
      const userExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
        [usuario_modificador]
      );
      const [{ idUser }] = userExists[0];
      if (idUser === 0) {
        const error = new Error("El usuario que esta intentando modificar el cliente no existe en la base de datos");
        return res.status(409).json({ error: error.message });
      }

      // const customerExists = await connection.query(
      //   "select count(nombre_cliente) as valueName from cliente where nombre_cliente = ? and BIN_TO_UUID(id) != ?;",
      //   [nombre_cliente, id]
      // );
      // const [{ valueName }] = customerExists[0];
      // if (valueName === 1) {
      //   const error = new Error(
      //     "Este código del cliente se encuentra registrado en la base de datos..."
      //   );
      //   return res.status(409).json({ error: error.message });
      // }

      const result = await connection.query(
        "update cliente set cedula_cliente = ?, nombre_cliente = ?, telefono_cliente = ?, celular_cliente = ?, correo_cliente = ?, direccion_cliente = ?, ruc = ?, contacto = ?, estado = ?, termino_venta = ?, limite_credito = ?, fecha_modificacion = now(), usuario_modificador =  UUID_TO_BIN(?) where BIN_TO_UUID(id) = ?;",
        [          
          cedula_cliente,
          nombre_cliente,
          telefono_cliente,
          celular_cliente,
          correo_cliente,
          direccion_cliente,
          ruc,
          contacto,
          estado,
          termino_venta, 
          limite_credito,                   
          usuario_modificador,
          id,
        ]
      );    

      res.send("El cliente se modifico correctamente...");
    } catch (error) {
       res.status(500).json({ error: error.message });
    }
  };

  // * Delete supplier  by id
  static deleteCustomer = async (req: Request, res: Response) => {
    const { idCustomer } = req.params;
    try {    
      await connection.query(
        "delete from cliente where BIN_TO_UUID(id) = ?",
        [idCustomer]
      );

      res.send("El cliente se elimino correctamente...");
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}
