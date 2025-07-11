import { Request, Response } from "express";
import { connection } from "../config/db";
import { checkedPassword, hashPassword } from "../utils/users";
import { generateToken } from "../utils/generateToken";
import { generateJWT } from "../utils/jwt";
import { AuthEmail } from "../emials/AuthEmails";

export class AuthController {
  // * Confirm Account
  static confirmAccount = async (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      const expiredToken = await connection.query(
        "select count(token) as tokenExpired from token where token = ?;",
        [token]
      );
      const [{ tokenExpired }] = expiredToken[0];
      if (tokenExpired === 0) {
        const error = new Error("EL token ya expiro, vuelva a solicitar otro código...");
        return res.status(404).json({ error: error.message });
      }

      const tokenExists = await connection.query(
        "select count(token) as valueToken from token where token = ?;",
        [token]
      );
      const [{ valueToken }] = tokenExists[0];
      if (valueToken === 0) {
        const error = new Error("Token no válido");
        return res.status(401).json({ error: error.message });
      }

      const data = await connection.query(
        "select BIN_TO_UUID(id) as idToken, BIN_TO_UUID(id_usuario) as resultIdUser from token where token = ?",
        [token]
      );

      const [{ idToken, resultIdUser }] = data[0];
      const confirmacion = 1;

      const updateUser = await connection.query(
        "update usuario set confirmacion = ? where BIN_TO_UUID(id) = ?;",
        [confirmacion, resultIdUser]
      );
      const deleteToken = await connection.query(
        "delete from token where BIN_TO_UUID(id) = ?;",
        [idToken]
      );

      res.send("Cuenta confirmada correctamente...");
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // * Login
  static login = async (req: Request, res: Response) => {
    try {
      const { correo_usuario, password, detalle_inicio_sesion } = req.body;

      const userExists = await connection.query(
        "select count(id) as idvalue from usuario where correo_usuario = ?",
        [correo_usuario]
      );
      const [{ idvalue }] = userExists[0];
      if (idvalue === 0) {
        const error = new Error("Usuario no encontrado");
        return res.status(404).json({ error: error.message });
      }

      const idUser = await connection.query(
        "select BIN_TO_UUID(id) as id, nombre_usuario, password as userPassword from usuario where correo_usuario = ?;",
        [correo_usuario]
      );
      const [{ id, nombre_usuario, userPassword }] = idUser[0];

      const userConfirm = await connection.query(
        "select confirmacion from usuario where BIN_TO_UUID(id) = ?",
        [id]
      );
      const [{ confirmacion }] = userConfirm[0];


      const newToken = generateToken();
      if (confirmacion === 0) {
        const createNewToken = await connection.query(
          "insert into token (token, id_usuario, fecha_creacion) values(?, UUID_TO_BIN(?), now());",
          [newToken, id]
        );

        AuthEmail.sendConfirmationEmail({
          emailUser: correo_usuario,
          nameUser: nombre_usuario,
          tokenUSer: newToken,
        });

        const error = new Error(
          "La cuenta no ha sido confirmada, hemos enviado un email de confirmación"
        );
        return res.status(401).json({ error: error.message });
      }

      const isPasswordCorrect = await checkedPassword(password, userPassword);
      if (!isPasswordCorrect) {
        const error = new Error("Contraseña incorrecta...")
        return res.status(401).json({ error: error.message })
      }

      const permissionsExists = await connection.query(
        "select estado from usuario where BIN_TO_UUID(id) = ?;",
        [id]
      );
      const [{ estado }] = permissionsExists[0];

      if (estado === 0) {
        const error = new Error(
          "Esta cuenta se encuentra inactiva, debes de solicitar activar tu cuenta..."
        );
        return res.status(409).json({ error: error.message });
      }

      const statement = await connection.query(
        "select count(empresa or usuario or proveedor or cliente or marca or categoria or producto or remisiones or inventario or compra or devolucion_compra or cotizacion_venta or prefacturacion or venta or devolucion_venta or  kardex or reportes_inventario or cuenta_corriente or cuenta_xpagar or cuenta_xcobrar or contabilidad or reportes) as permissionsValue  from permisos where BIN_TO_UUID(id_usuario) = ?;",
        [id]
      );
      const [{ permissionsValue }] = statement[0];

      if (permissionsValue === 0) {
        const error = new Error(
          "Este usuario aun no tiene permisos asignados..."
        );
        return res.status(404).json({ error: error.message });
      }

      for (const detalleLogin of detalle_inicio_sesion) {
        await connection.query(
          "insert into dispositivo_usuario (sesion_activa, navegador, sistema_operativo, tipo_dispositivo, user_agent, fecha_inicio_sesion, id_usuario) values (?, ?, ?, ?, ?, now(), UUID_TO_BIN(?));",
          [
            detalleLogin.sesion_activa,
            detalleLogin.navegador,
            detalleLogin.sistema_operativo,
            detalleLogin.tipo_dispositivo,
            detalleLogin.user_agent,
            id
          ]
        );

        const user = {
          emailUser: correo_usuario,
          nameUser: nombre_usuario,
          tokenUSer: newToken,
        }

        const login = {
          sesion_activa: detalleLogin.sesion_activa,
          navegador: detalleLogin.navegador,
          sistema_operativo: detalleLogin.sistema_operativo,
          tipo_dispositivo: detalleLogin.tipo_dispositivo,
          user_agent: detalleLogin.user_agent,
        }

        AuthEmail.sendLogin({ user, login });
      }

      const jwtToken = generateJWT({ id: id });

      res.send(jwtToken);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // * Request confirmation code
  static requestConfirmationCode = async (req: Request, res: Response) => {
    try {
      const { correo_usuario } = req.body;
      const userExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idvalue from usuario where correo_usuario = ?;",
        [correo_usuario]
      );
      const [{ idvalue }] = userExists[0];
      if (idvalue === 0) {
        const error = new Error("Usuario no esta registrado");
        return res.status(404).json({ error: error.message });
      }

      const idUser = await connection.query(
        "select BIN_TO_UUID(id) as id, nombre_usuario from usuario where correo_usuario = ?;",
        [correo_usuario]
      );
      const [{ id, nombre_usuario }] = idUser[0];

      const userConfirm = await connection.query(
        "select confirmacion from usuario where BIN_TO_UUID(id) = ?",
        [id]
      );

      const [{ confirmacion }] = userConfirm[0];
      if (confirmacion === 1) {
        const error = new Error("Su cuenta ya se encuentra confirmada...");
        return res.status(403).json({ error: error.message });
      }

      const newToken = generateToken();
      const createNewToken = await connection.query(
        "insert into token (token, id_usuario, fecha_creacion) values(?, UUID_TO_BIN(?), now());",
        [newToken, id]
      );

      AuthEmail.sendConfirmationEmail({
        emailUser: correo_usuario,
        nameUser: nombre_usuario,
        tokenUSer: newToken,
      });

      res.send("Se envio un nuevo token a tu correo");
    } catch (error) {
      res.status(500).json({ error: "Hubo un error" });
    }
  };

  // * Forgot Password
  static forgotPassword = async (req: Request, res: Response) => {
    try {
      const { correo_usuario } = req.body;
      const userExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idvalue from usuario where correo_usuario = ?;",
        [correo_usuario]
      );

      const [{ idvalue }] = userExists[0];
      if (idvalue === 0) {
        const error = new Error("Usuario no esta registrado");
        return res.status(404).json({ error: error.message });
      }

      const idUser = await connection.query(
        "select BIN_TO_UUID(id) as id, nombre_usuario from usuario where correo_usuario = ?;",
        [correo_usuario]
      );
      const [{ id, nombre_usuario }] = idUser[0];

      const newToken = generateToken();
      const stateConfirmation = 0;

      const createNewToken = await connection.query(
        "insert into token (token, confirmacion, id_usuario, fecha_creacion) values(?, ?, UUID_TO_BIN(?), now());",
        [newToken, stateConfirmation, id]
      );

      AuthEmail.sendPasswordResetToken({
        emailUser: correo_usuario,
        nameUser: nombre_usuario,
        tokenUSer: newToken,
      });

      res.send("Revisa tu correo para seguir las instrucciones");
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // * Validate token
  static validateToken = async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      const tokenExists = await connection.query(
        "select count(token) as tokenvalue from token where token = ?;",
        [token]
      );

      const [{ tokenvalue }] = tokenExists[0];
      if (tokenvalue === 0) {
        const error = new Error("Token no válido");
        return res.status(401).json({ error: error.message });
      }
      res.send("Token válido, define tu nueva conttraseña...");
    } catch (error) {
      res.status(500).json({ error: "Hubo un error" });
    }
  };

  // * Update password with token
  static updatePasswordWithToken = async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const tokenExists = await connection.query(
        "select count(token) as tokenValue from token where token = ?;",
        [token]
      );

      const [{ tokenValue }] = tokenExists[0];
      if (tokenValue === 0) {
        const error = new Error("Token no válido");
        return res.status(401).json({ error: error.message });
      }

      const idUserToken = await connection.query(
        "select BIN_TO_UUID(t.id_usuario) as id_usuario from token t inner join usuario u on BIN_TO_UUID(t.id_usuario) = BIN_TO_UUID(u.id) where t.token = ?;",
        [token]
      );

      const newPassword = await hashPassword(req.body.password);
      const [{ id_usuario }] = idUserToken[0];

      const result = await connection.query(
        "update usuario set password = ? where BIN_TO_UUID(id) = ?;",
        [newPassword, id_usuario]
      );
      const deleteToken = await connection.query(
        "delete from token where token = ?",
        [token]
      );

      res.send("La contraseña se modifico correctamente...");
    } catch (error) {
      res.status(500).json({ error: "Hubo un error" });
    }
  };

  static closetSession = async (req: Request, res: Response) => {
    try {
       const { id } = req.params;
      const deleteToken = await connection.query(
        "update from dispositivo_usuario where sesion_activa = 0;",
        [id]
      );
    } catch (error) {
      res.status(500).json({ error: "Hubo un error" });
    }
  };

  // *  Get authenticate user
  static user = async (req: Request, res: Response) => {
    return res.json(req.user);
  };
}
