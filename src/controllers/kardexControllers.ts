import type { Request, Response } from "express";
import { connection } from "../config/db";

export class KardexController {
    // * Get details kardex by id product
    static getDetailsKardexById = async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            const result = await connection.query(
                "select date_format(k.fecha_creacion, '%d/%m/%Y') as fecha_creacion, BIN_TO_UUID(k.id) as id, k.descripcion, p.nombre_producto, k.tipo,  k.cantidad_entrada, k.precio_entrada, k.total_entrada,  k.cantidad_salida, k.precio_salida, k.precio_facturacion, k.total_salida, k.cantidad_disponible, k.precio_disponible, k.total_disponible from kardex k inner join  producto p on p.id=k.id_producto where BIN_TO_UUID(k.id_producto) = ? order by k.fecha_creacion desc;",
                [id]
            );
            res.json(result[0]);
        } catch (error) {
            res.status(500).json({ error: error.message })
        }
    } 

    // * Get kardex by date range
    static getKardexByDate = async (req: Request, res: Response) => {        
        const {startDate, endDate} = req.params;

        try {
            if(startDate && endDate){
                const result = await connection.query(
                    "select date_format(k.fecha_creacion, '%d/%m/%Y') as fecha_creacion, BIN_TO_UUID(k.id) as id, p.nombre_producto, k.descripcion, k.tipo, k.cantidad_entrada, k.precio_entrada, k.total_entrada, k.cantidad_salida, k.precio_salida, k.precio_facturacion, k.total_salida, k.cantidad_disponible, k.precio_disponible, k.total_disponible from kardex k inner join producto p on p.id=k.id_producto where k.fecha_creacion between ? and ? order by k.fecha_creacion desc;",
                    [startDate, endDate]
                );
                res.json(result[0]);
            }
        } catch (error) {
            res.status(500).json({ error: error.message })
        }
    }

    // * Get kardex by id product and date
    static getKardexByIdProductAndDate = async (req: Request, res: Response) => {                
        const {id, startDate, endDate} = req.params;        
        try {
            if(startDate && endDate && id){
                const result = await connection.query(
                    "select date_format(k.fecha_creacion, '%d/%m/%Y') as fecha_creacion, BIN_TO_UUID(k.id) as id, k.descripcion, p.nombre_producto, k.tipo, k.cantidad_entrada, k.precio_entrada, k.total_entrada, k.cantidad_salida, k.precio_salida, k.precio_facturacion, k.total_salida, k.cantidad_disponible, k.precio_disponible, k.total_disponible from kardex k inner join producto p on p.id=k.id_producto where k.fecha_creacion between ? and ? and BIN_TO_UUID(p.id) = ? order by k.fecha_creacion desc;",
                    [startDate, endDate, id]
                );
                res.json(result[0]);
            }
        } catch (error) {
            res.status(500).json({ error: error.message })
        }
    }
}