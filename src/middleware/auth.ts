import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { usersInterface } from "../interface/valueInterface";
import { connection } from "../config/db";

declare global {
    namespace Express {
        interface Request {
            user?: usersInterface
        }
    }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const bearer = req.headers.authorization

    if (!bearer) {
        const error = new Error("No autorizado")
        return res.status(401).json({ error: error.message })
    }

    const [, token] = bearer.split(" ");

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        if (typeof decoded === "object" && decoded.id) {
            const user = await connection.query(
                "select BIN_TO_UUID(u.id) as id, u.nombre_usuario, u.correo_usuario, u.tipo_usuario, p.empresa, p.permisos_empresa, p.usuario, p.permisos_usuario, p.proveedor, p.permisos_proveedor, p.cliente, p.permisos_cliente, p.marca, p.permisos_marca, p.categoria, p.permisos_categoria, p.producto, p.permisos_producto, p.inventario, p.remisiones, p.permisos_remisiones, p.compra, p.permisos_compra, p.devolucion_compra, p.permisos_devolucion_compra, p.producto_apartado, p.permisos_producto_apartado, p.cotizacion_venta, p.permisos_cotizacion_venta, p.prefacturacion, p.permisos_prefacturacion, p.venta, p.permisos_venta, p.devolucion_venta, p.permisos_devolucion_venta, p.kardex, p.reportes_inventario, p.cuenta_corriente, p.permisos_cuenta_corriente, p.cuenta_xcobrar, p.permisos_cuenta_xcobrar, p.cuenta_xpagar, p.permisos_cuenta_xpagar,  p.contabilidad, p.permisos_contabilidad, p.reportes from permisos p inner join usuario u on BIN_TO_UUID(p.id_usuario)=BIN_TO_UUID(u.id) where BIN_TO_UUID(id_usuario) = ?;",
                [decoded.id]
            );            

            const userValue = await user[0]
            if (user) {
                req.user = userValue[0]
            }
            else {
                res.status(500).json({ error: "Token no válido" });
            }
        }
    } catch (error) {
        res.status(500).json({ error: "Token no válido" });
    }
    next()
}