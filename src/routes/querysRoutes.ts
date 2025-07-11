import { Router } from "express";
import { QuerysController } from "../controllers/querysControllers";

const querysRoutes = Router();

// * Get all information about the company
querysRoutes.get(
  "/",
  QuerysController.getQueryInitial
);



export default querysRoutes;
