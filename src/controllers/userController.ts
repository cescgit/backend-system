import type { Request, Response } from "express";
import { connection } from "../config/db";
import type { usersInterface } from "../interface/valueInterface";
import { checkedPassword, hashPassword } from "../utils/users";

export class UserController {
  // * Get alls users
  static getAllUsers = async (req: Request, res: Response) => {
    try {
      const result = await connection.query(
        "select BIN_TO_UUID(u.id) as id, u.nombre_usuario, u.cedula_usuario, u.celular_usuario, u.correo_usuario, u.tipo_usuario, u.estado, u.fecha_creacion, coalesce(uc.nombre_usuario, '') as nombre_usuario_creador, coalesce(um.nombre_usuario, '') as nombre_usuario_modificador from usuario u left join usuario uc on uc.id=u.usuario_creador left join usuario um on um.id=u.usuario_modificador;"
      );

      res.json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // * Get alls users
  static getAllDataUsers = async (req: Request, res: Response) => {
    try {
      const result = await connection.query(
        "select BIN_TO_UUID(id) as id, nombre_usuario, cedula_usuario, celular_usuario, correo_usuario, password, tipo_usuario, estado, fecha_creacion, fecha_modificacion, BIN_TO_UUID(usuario_creador) as usuario_creado, BIN_TO_UUID( usuario_modificador) as usuario_modificador from usuario;"
      );

      res.json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // * Get sser by id
  static getUserById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const result = await connection.query(
        "select BIN_TO_UUID(id) as id, nombre_usuario, cedula_usuario, celular_usuario, correo_usuario, password, tipo_usuario, estado, fecha_creacion, fecha_modificacion, BIN_TO_UUID(usuario_creador) as usuario_creado, BIN_TO_UUID( usuario_modificador) as usuario_modificador from usuario where BIN_TO_UUID(id) = ?;",
        [id]
      );      
      res.json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // *  Create first user
  static createFirstUser = async (req: Request, res: Response) => {
    const usuario = <usersInterface>req.body;

    const {
      nombre_usuario,
      cedula_usuario,
      celular_usuario,
      correo_usuario,
      password,
      tipo_usuario,
      estado,      
    } = usuario;

    try {
      const cedulaExists = await connection.query(
        "select count(cedula_usuario) as valueCedula from usuario where cedula_usuario = ?;",
        [cedula_usuario]
      );
      const [{ valueCedula }] = (cedulaExists as any)[0];

      if (valueCedula === 1) {
        const error = new Error(
          "Esta cédula ya existen en la base de datos..."
        );
        return res.status(409).json({ error: error.message });
      }

      const emailExists = await connection.query(
        "select count(correo_usuario) as valueEmail from usuario where correo_usuario = ?;",
        [correo_usuario]
      );
      const [{ valueEmail }] = (emailExists as any)[0];

      if (valueEmail === 1) {
        const error = new Error(
          "Este correo se encuentra registrado en la base de datos..."
        );
        return res.status(409).json({ error: error.message });
      }

      const passwordHasheada = await hashPassword(password);

      const result = await connection.query(
        "insert into usuario (nombre_usuario, cedula_usuario, celular_usuario, correo_usuario, password, tipo_usuario, estado, fecha_creacion) values (?, ?, ?, ?, ?, ?, ?, now());",
        [
          nombre_usuario,
          cedula_usuario,
          celular_usuario,
          correo_usuario,
          passwordHasheada,
          tipo_usuario,
          estado        
        ]
      );

      res.send("Usuario creado correctamente");
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // *  Create user acount
  static createUser = async (req: Request, res: Response) => {
    const user = <usersInterface>req.body;

    const {
      nombre_usuario,
      cedula_usuario,
      celular_usuario,
      correo_usuario,
      password,
      tipo_usuario,
      estado,
      fecha_creacion,
      usuario_creador,
    } = user;

    try {
      const userExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
        [usuario_creador]
      );
      const [{ idUser }] = (userExists as any)[0];
        if (idUser === 0) {
          const error = new Error("Hubo un error al guardar el registro");
          return res.status(409).json({ error: error.message });
        }

      const cedulaExists = await connection.query(
        "select count(cedula_usuario) as valueCedula from usuario where cedula_usuario = ?;",
        [cedula_usuario]
      );
      const [{ valueCedula }] = (cedulaExists as any)[0];

      if (valueCedula === 1) {
        const error = new Error(
          "Esta cédula ya existen en la base de datos..."
        );
        return res.status(409).json({ error: error.message });
      }

      const emailExists = await connection.query(
        "select count(correo_usuario) as valueEmail from usuario where correo_usuario = ?;",
        [correo_usuario]
      );
      const [{ valueEmail }] = (emailExists as any)[0];

      if (valueEmail === 1) {
        const error = new Error(
          "Este correo se encuentra registrado en la base de datos..."
        );
        return res.status(409).json({ error: error.message });
      }

      const passwordHasheada = await hashPassword(password);

      await connection.query(
        "insert into usuario (nombre_usuario, cedula_usuario, celular_usuario, correo_usuario, password, tipo_usuario, estado, usuario_creador, fecha_creacion) values (?, ?, ?, ?, ?, ?, ?, UUID_TO_BIN(?), now());",
        [
          nombre_usuario,
          cedula_usuario,
          celular_usuario,
          correo_usuario,
          passwordHasheada,
          tipo_usuario,
          estado,                  
          usuario_creador,
        ]
      );

      res.send("Usuario creado correctamente");
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // * Update user personal data
  static updateDataUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = <usersInterface>req.body;
    try {      
      const userExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
        [id]
      );
      const [{ idUser }] = (userExists as any)[0];
      if (idUser === 0) {
        const error = new Error("El usuario no existe...");
        return res.status(409).json({ error: error.message });
      }

      const { celular_usuario, correo_usuario, password, oldPasswordUser } = user;

      const emailExists = await connection.query(
        "select count(correo_usuario) as valueEmail from usuario where correo_usuario = ? and BIN_TO_UUID(id) != ?;",
        [correo_usuario, id]
      );
      const [{ valueEmail }] = (emailExists as any)[0];

      if (valueEmail === 1) {
        const error = new Error(
          "Este correo se encuentra registrado en la base de datos..."
        );
        return res.status(409).json({ error: error.message });
      }

      const passwordOld = await connection.query(
        "select password as getOldPassword from usuario where id = UUID_TO_BIN(?);",
        [id]
      );
      const [{getOldPassword}] = (passwordOld as any)[0];

      const passwordHasheada = await hashPassword(password);
      const isPasswordCorrect = await checkedPassword(oldPasswordUser, getOldPassword);
       if(!isPasswordCorrect) {
        const error = new Error("La contraseña no coincide con la anterior...");
        return res.status(404).json({error: error.message})
      }

      await connection.query(
        "update usuario set celular_usuario = ?, correo_usuario = ?, password = ?, fecha_modificacion = now() where BIN_TO_UUID(id) = ?;",
        [
          celular_usuario,
          correo_usuario,    
          passwordHasheada,      
          id,
        ]
      );

      res.send("Sus datos se modificarón correctamente...");
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // * Update user by id
  static updateUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = <usersInterface>req.body;
    try {      
      const userExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idUser from usuario where BIN_TO_UUID(id) = ?;",
        [id]
      );
      const [{ idUser }] = (userExists as any)[0];
      if (idUser === 0) {
        const error = new Error("El usuario que esta editando no existe...");
        return res.status(409).json({ error: error.message });
      }

      const { nombre_usuario, cedula_usuario, celular_usuario, correo_usuario, tipo_usuario, estado, usuario_modificador } =
        user;

      const emailExists = await connection.query(
        "select count(correo_usuario) as valueEmail from usuario where correo_usuario = ? and BIN_TO_UUID(id) != ?;",
        [correo_usuario, id]
      );
      const [{ valueEmail }] = (emailExists as any)[0];

      if (valueEmail === 1) {
        const error = new Error(
          "Este correo se encuentra registrado en la base de datos..."
        );
        return res.status(409).json({ error: error.message });
      }     

      const result = await connection.query(
        "update usuario set nombre_usuario = ?, cedula_usuario = ?, celular_usuario = ?, correo_usuario = ?, tipo_usuario = ?, estado = ?, usuario_modificador = UUID_TO_BIN(?),  fecha_modificacion = now() where BIN_TO_UUID(id) = ?;",
        [
          nombre_usuario,
          cedula_usuario,
          celular_usuario,
          correo_usuario,
          tipo_usuario,
          estado,
          usuario_modificador,   
          id
        ]
      );

      res.send("Los datos se modificarón correctamente...");
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // * Delete user by id
  static deleteUser = async (req: Request, res: Response) => {
    const { idUser } = req.params;    
    try {
      const exitstUser = await connection.query(
        "select count(BIN_TO_UUID(id)) as id from usuario where BIN_TO_UUID(id) = ?;",
        [idUser]
      );
      const [{ id }] = (exitstUser as any)[0];      

      if (id === 0) {
        const error = new Error(
          "El usuario que estas buscando, no se encontro..."
        );
        return res.status(404).json({ error: error.message });
      }

      await connection.query("delete from usuario where BIN_TO_UUID(id) = ?",
        [idUser]
      );

      res.send("Usuario eliminado correctamente...");

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
