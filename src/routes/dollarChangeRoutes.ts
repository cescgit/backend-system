import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { DollarChangeController } from "../controllers/dollarChangeControllers";

const dollarChangeRoutes = Router();

// * Get all dollar change
dollarChangeRoutes.get(
  "/",
  DollarChangeController.getAllDollarChange
);

// * Get dollar change by id
dollarChangeRoutes.get(
  "/:id",
  param("id").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  DollarChangeController.getDollarChangeById
);

// * Create a new dollar change
dollarChangeRoutes.post(
  "/createDollarChange",  
  body("compra").notEmpty().withMessage("Debes de agregar el valor de la compra del dolar"),
  body("venta").notEmpty().withMessage("Debes de agregar el valor de la venta del dolar"),
  handleInputErrors,
  DollarChangeController.createDollarChane
);

// * Update dollar change by id
dollarChangeRoutes.patch(
  "/updateDollarChange/:id",
  param("id").isUUID().withMessage("Id no valido"),
  body("compra").notEmpty().withMessage("Debes de agregar el valor de la compra del dolar"),
  body("venta").notEmpty().withMessage("Debes de agregar el valor de la venta del dolar"),
  handleInputErrors,
  DollarChangeController.updateDollarChange
);

// * Delete dollar change by id
dollarChangeRoutes.delete(
  "/:idDollarChange",
  param("id").isUUID().withMessage("Id no valido"),
  DollarChangeController.deleteDollarChange
);

export default dollarChangeRoutes;
