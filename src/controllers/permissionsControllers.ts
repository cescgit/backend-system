import type { Request, Response } from "express";
import { connection } from "../config/db";
import { permissionsInterface } from "../interface/valueInterface";

export class PermissionsController {
  // * Get permissions for users
  static getPermissionsUsers = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const usuarioExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as valueUser from usuario where BIN_TO_UUID(id) = ?;",
        [id]
      );
      const [{ valueUser }] = usuarioExists[0];

      if (valueUser === 0) {
        const error = new Error(
          "Esta usuario no exite en la base de datos..."
        );
        return res.status(404).json({ error: error.message });
      }

      const permissionsExists = await connection.query(
        "select count(empresa or usuario or proveedor or cliente or marca or categoria or producto or inventario or remisiones or compra or producto_apartado or devolucion_compra or cotizacion_venta or prefacturacion or venta or devolucion_venta or  kardex or reportes_inventario or cuenta_corriente or cuenta_xpagar or cuenta_xcobrar or contabilidad or reportes) as permissionsValue  from permisos where BIN_TO_UUID(id_usuario) = ?;",
        [id]
      );
      const [{ permissionsValue }] = permissionsExists[0];

      if (permissionsValue === 0) {
        const error = new Error(
          "Este usuario aun no tiene permisos asignados..."
        );
        return res.status(404).json({ error: error.message });
      }

      const result = await connection.query(
        "select empresa, permisos_empresa, usuario, permisos_usuario, proveedor, permisos_proveedor, cliente, permisos_cliente, marca, permisos_marca, categoria, permisos_categoria, producto, permisos_producto, inventario, remisiones, permisos_remisiones, compra, permisos_compra, producto_apartado, permisos_producto_apartado, devolucion_compra, permisos_devolucion_compra, cotizacion_venta, permisos_cotizacion_venta, prefacturacion, permisos_prefacturacion, venta, permisos_venta, devolucion_venta, permisos_devolucion_venta, kardex, reportes_inventario, cuenta_corriente, permisos_cuenta_corriente, cuenta_xcobrar, permisos_cuenta_xcobrar, cuenta_xpagar, permisos_cuenta_xpagar,  contabilidad, permisos_contabilidad, reportes, BIN_TO_UUID(id_usuario) as id_usuario from permisos where BIN_TO_UUID(id_usuario) = ?;",
        [id]
      );

      const resultPermissions = result[0]

      res.json(resultPermissions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };


  // *  Create new permissions by user
  static createPermissionsUser = async (req: Request, res: Response) => {
    const { idUser } = req.params;
    const permissions = <permissionsInterface>req.body;

    const {
      empresa,
      permisos_empresa,
      usuario,
      permisos_usuario,
      proveedor,
      permisos_proveedor,
      cliente,
      permisos_cliente,
      marca,
      permisos_marca,
      categoria,
      permisos_categoria,
      producto,
      permisos_producto,
      inventario,
      permisos_remisiones,
      remisiones,
      compra,
      permisos_compra,
      devolucion_compra,
      permisos_devolucion_compra,
      cotizacion_venta,
      permisos_cotizacion_venta,
      producto_apartado,
      permisos_producto_apartado,
      prefacturacion,
      permisos_prefacturacion,
      venta,
      permisos_venta,
      devolucion_venta,
      permisos_devolucion_venta,
      kardex,
      reportes_inventario,
      cuenta_corriente,
      permisos_cuenta_corriente,
      cuenta_xcobrar,
      permisos_cuenta_xcobrar,
      cuenta_xpagar,
      permisos_cuenta_xpagar,
      contabilidad,
      permisos_contabilidad,
      reportes,
    } = permissions;    

    try {
      const userExists = await connection.query(
        "select count(BIN_TO_UUID(id)) as idUserDataBase from usuario where BIN_TO_UUID(id) = ?;",
        [idUser]
      );
      const [{ idUserDataBase }] = userExists[0];
      if (idUserDataBase === 0) {
        const error = new Error("El usuario no se encuentra registrado en la base de datos...");
        return res.status(409).json({ error: error.message }); 4
      }

      const permissionsExists = await connection.query(
        "select count(empresa or usuario or proveedor or cliente or marca or categoria or producto or inventario or remisiones or compra or devolucion_compra or producto_apartado or cotizacion_venta or prefacturacion or venta or devolucion_venta or  kardex or reportes_inventario or cuenta_corriente or cuenta_xpagar or cuenta_xcobrar or contabilidad or reportes) as permissionsValue from permisos where BIN_TO_UUID(id_usuario) = ?;",
        [idUser]
      );
      const [{ permissionsValue }] = permissionsExists[0];

      if (permissionsValue === 0) {
        await connection.query(
          "insert into permisos (empresa, permisos_empresa, usuario, permisos_usuario, proveedor, permisos_proveedor, cliente, permisos_cliente, marca, permisos_marca,categoria, permisos_categoria, producto, permisos_producto, inventario, remisiones, permisos_remisiones, compra, permisos_compra, devolucion_compra, permisos_devolucion_compra, producto_apartado, permisos_producto_apartado, cotizacion_venta, permisos_cotizacion_venta, prefacturacion, permisos_prefacturacion, venta, permisos_venta, devolucion_venta, permisos_devolucion_venta, kardex, reportes_inventario, cuenta_corriente, permisos_cuenta_corriente, cuenta_xcobrar, permisos_cuenta_xcobrar, cuenta_xpagar, permisos_cuenta_xpagar, contabilidad, permisos_contabilidad, reportes, id_usuario) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, UUID_TO_BIN(?));",
          [
            empresa,
            JSON.stringify(permisos_empresa),
            usuario,
            JSON.stringify(permisos_usuario),
            proveedor,
            JSON.stringify(permisos_proveedor),
            cliente,
            JSON.stringify(permisos_cliente),
            marca,
            JSON.stringify(permisos_marca),
            categoria,
            JSON.stringify(permisos_categoria),
            producto,
            JSON.stringify(permisos_producto),
            inventario,
            remisiones,
            JSON.stringify(permisos_remisiones),
            compra,
            JSON.stringify(permisos_compra),
            devolucion_compra,
            JSON.stringify(permisos_devolucion_compra),
            producto_apartado,
            JSON.stringify(permisos_producto_apartado),
            cotizacion_venta,
            JSON.stringify(permisos_cotizacion_venta),
            prefacturacion,
            JSON.stringify(permisos_prefacturacion),
            venta,
            JSON.stringify(permisos_venta),
            devolucion_venta,
            JSON.stringify(permisos_devolucion_venta),
            kardex,
            reportes_inventario,
            cuenta_corriente,
            JSON.stringify(permisos_cuenta_corriente),
            cuenta_xcobrar,
            JSON.stringify(permisos_cuenta_xcobrar),
            cuenta_xpagar,
            JSON.stringify(permisos_cuenta_xpagar),
            contabilidad,
            JSON.stringify(permisos_contabilidad),
            reportes,
            idUser
          ]
        );

        res.send("Se han creado los permisos correctamente...");
      }
      else {
        await connection.query(
          "update permisos set empresa = ?, permisos_empresa = ?, usuario = ?, permisos_usuario = ?, proveedor = ?, permisos_proveedor = ?, cliente = ?, permisos_cliente = ?, marca = ?, permisos_marca = ?, categoria = ?, permisos_categoria = ?, producto = ?, permisos_producto = ?, inventario = ?, remisiones = ?, permisos_remisiones = ?, compra = ?, permisos_compra = ?, devolucion_compra = ?, permisos_devolucion_compra = ?, producto_apartado = ?, permisos_producto_apartado = ?, cotizacion_venta = ?, permisos_cotizacion_venta = ?, prefacturacion = ?, permisos_prefacturacion = ?, venta = ?, permisos_venta = ?, devolucion_venta = ?, permisos_devolucion_venta = ?, kardex = ?, reportes_inventario = ?, cuenta_corriente = ?, permisos_cuenta_corriente = ?, cuenta_xcobrar = ?, permisos_cuenta_xcobrar = ?, cuenta_xpagar = ?, permisos_cuenta_xpagar = ?, contabilidad = ?, permisos_contabilidad = ?, reportes = ?, id_usuario = UUID_TO_BIN(?) where BIN_TO_UUID(id_usuario) = ?;",
          [
            empresa,
            JSON.stringify(permisos_empresa),
            usuario,
            JSON.stringify(permisos_usuario),
            proveedor,
            JSON.stringify(permisos_proveedor),
            cliente,
            JSON.stringify(permisos_cliente),
            marca,
            JSON.stringify(permisos_marca),
            categoria,
            JSON.stringify(permisos_categoria),
            producto,
            JSON.stringify(permisos_producto),
            inventario,
            remisiones,
            JSON.stringify(permisos_remisiones),
            compra,
            JSON.stringify(permisos_compra),
            devolucion_compra,
            JSON.stringify(permisos_devolucion_compra),
            producto_apartado,
            JSON.stringify(permisos_producto_apartado),
            cotizacion_venta,
            JSON.stringify(permisos_cotizacion_venta),
            prefacturacion,
            JSON.stringify(permisos_prefacturacion),
            venta,
            JSON.stringify(permisos_venta),
            devolucion_venta,
            JSON.stringify(permisos_devolucion_venta),
            kardex,
            reportes_inventario,
            cuenta_corriente,
            JSON.stringify(permisos_cuenta_corriente),
            cuenta_xcobrar,
            JSON.stringify(permisos_cuenta_xcobrar),
            cuenta_xpagar,
            JSON.stringify(permisos_cuenta_xpagar),
            contabilidad,
            JSON.stringify(permisos_contabilidad),
            reportes,
            idUser,
            idUser
          ]
        );

        res.send("Los permisos se modificaron correctamente...");
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}
