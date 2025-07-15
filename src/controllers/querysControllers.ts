import type { Request, Response } from "express";
import { connection } from "../config/db";

export class QuerysController {
    // * Get querys initial system
    static getQueryInitial = async (req: Request, res: Response) => {
        try {
          const result = await connection.query(
            "select logotipo from empresa;"
          );
          res.json(result[0]);
        } catch (error: any) {
          res.status(500).json({error: error.message});
        }
      }
}
