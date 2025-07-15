import type { Request, Response } from "express";
import { connection } from "../config/db";
import { companyInterface } from "../interface/valueInterface";

export class CompanyController {
  // * Get alls information about the company
  static getCompany = async (req: Request, res: Response) => {
    try {
      const result = await connection.query(
        "select BIN_TO_UUID(id) as id, nombre_empresa, eslogan, direccion_empresa, ruc, telefono_empresa, celular_empresa, correo_empresa, logotipo, fecha_creacion, fecha_modificacion from empresa;"
      );
      res.json(result[0]);
    } catch (error: any) {
       res.status(500).json({ error: error.message });
    }
  };

    // * Get information about the company by id
    static getCompanyById = async (req: Request, res: Response) => {
      const { id } = req.params;
      try {
        const result = await connection.query(
          "select BIN_TO_UUID(id) as id, nombre_empresa, eslogan, direccion_empresa, ruc, telefono_empresa, celular_empresa, correo_empresa, logotipo, fecha_creacion, fecha_modificacion from empresa where BIN_TO_UUID(id) = ?;",
          [id]
        );
        
        res.json(result[0]);
      } catch (error: any) {
         res.status(500).json({ error: error.message });
      }
    };

  // *  Create unique information for about company
  static createFirstCompany = async (req: Request, res: Response) => {
    const company = <companyInterface>req.body;

    const {
      nombre_empresa,
      direccion_empresa,
      eslogan,
      ruc,
      telefono_empresa,
      celular_empresa,
      correo_empresa,
      logotipo,   
      usuario_creador,      
    } = company;

    try {
      const userExists = await connection.query(
        "select count(id) as idUser from usuario where BIN_TO_UUID(id) = ?;",
        [usuario_creador]
      );
      const [{ idUser }] = (userExists as any)[0];

      if (idUser === 0) {
        const error = new Error(
          "El usuario que esta intentando crear la información de la empresa no existe ne la base de datos..."
        );
        return res.status(409).json({ error: error.message });
      }

      const result = await connection.query(
        "insert into empresa (nombre_empresa, eslogan, direccion_empresa, ruc, telefono_empresa, celular_empresa, correo_empresa, logotipo, fecha_creacion, usuario_creador) values (?, ?, ?, ?, ?, ?, ?, ?, now(), UUID_TO_BIN(?));",
        [
          nombre_empresa,
          eslogan,
          direccion_empresa,
          ruc,
          telefono_empresa,
          celular_empresa,
          correo_empresa,
          logotipo,       
          usuario_creador,          
        ]
      );

      res.send("La información de la empresa se guardo correctamente...");
    } catch (error: any) {
       res.status(500).json({ error: error.message });
    }
  };

  // * Update information about the company
  static updateCustomerType = async (req: Request, res: Response) => {
    const { id } = req.params;
    const company = <companyInterface>req.body;

    const {
      nombre_empresa,
      eslogan,
      direccion_empresa,
      ruc,
      telefono_empresa,
      celular_empresa,
      correo_empresa,
      logotipo,               
      usuario_modificador,
    } = company;

    try {
      const userExists = await connection.query(
        "select count(id) as idUser from usuario where  BIN_TO_UUID(id) = ?;",
        [usuario_modificador]
      );
      const [{ idUser }] = (userExists as any)[0];

      if (idUser === 0) {
        const error = new Error(
          "El usuario que esta intentando crear la información de la empresa no existe ne la base de datos..."
        );
        return res.status(409).json({ error: error.message });
      }

      const companyExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idCompany from empresa where BIN_TO_UUID(id) = ?;",
        [id]
      );
      const [{ idCompany }] = (companyExists as any)[0];
      if (idCompany === 0) {
        const error = new Error(
          "La información que estas buscando no se encontro..."
        );
        return res.status(404).json({ error: error.message });
      }


      const result = await connection.query(
        "update empresa set nombre_empresa = ?, eslogan = ?, direccion_empresa = ?, ruc = ?, telefono_empresa = ?, celular_empresa = ?, correo_empresa = ?, logotipo = ?, fecha_modificacion = now(), usuario_modificador =  UUID_TO_BIN(?) where BIN_TO_UUID(id) = ?;",
        [
          nombre_empresa,
          eslogan,
          direccion_empresa,
          ruc,
          telefono_empresa,
          celular_empresa,
          correo_empresa,
          logotipo,          
          usuario_modificador,          
          id,
        ]
      );

      res.send("La información de la empresa se modifico correctamente...");
    } catch (error: any) {
       res.status(500).json({ error: error.message });
    }
  };
}
