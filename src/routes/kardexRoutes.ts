import { Router } from "express";
import { param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { KardexController } from "../controllers/kardexControllers";

const routeKardex = Router();

// * Get kardex by id product
routeKardex.get(
  "/:id",
  param("id").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  KardexController.getDetailsKardexById
);

// * Get kardex by date
routeKardex.get(
  "/:startDate/:endDate",
  param("startDate").isDate().withMessage("Fecha de inicio no valida"),
  param("endDate").isDate().withMessage("Fecha de fin no valida"),
  handleInputErrors,
  KardexController.getKardexByDate
);

// * Get kardex by date and id product
routeKardex.get(
  "/:id/:startDate/:endDate",
  handleInputErrors,
  KardexController.getKardexByIdProductAndDate
);

export default routeKardex;