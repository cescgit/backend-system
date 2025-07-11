import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { TaxesController } from "../controllers/taxesContollers";

const routeTaxes = Router();

// * Get all taxes
routeTaxes.get("/", TaxesController.getAllTaxes);

// * Get tax by id
routeTaxes.get(
  "/:id",
  param("id").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  TaxesController.getTaxesById
);

// * Create a new tax
routeTaxes.post(
  "/createTax",
  body("abreviatura")
    .notEmpty()
    .withMessage("Debes de agregar la abreviatura"),
  body("descripcion")
    .notEmpty()
    .withMessage("Debes de agregar la descripcion"),
  body("valor_porcentaje")
    .notEmpty()
    .withMessage("Debes de agregar el porcentaje del impuesto"),
  body("valor_cantidad")
    .notEmpty()
    .withMessage("Debes de agregar el valor del impuesto"),
  handleInputErrors,
  TaxesController.createTax
);

// * Update tax by id
routeTaxes.patch(
  "/updateTax/:id",
  param("id").isUUID().withMessage("Id no valido"),
  body("abreviatura").notEmpty().withMessage("Debes de agregar la abreviatura"),
  body("descripcion").notEmpty().withMessage("Debes de agregar la descripcion"),
  body("valor_porcentaje")
    .notEmpty()
    .withMessage("Debes de agregar el porcentaje del impuesto"),
  body("valor_cantidad")
    .notEmpty()
    .withMessage("Debes de agregar el valor del impuesto"),
  handleInputErrors,
  TaxesController.updateTax
);

routeTaxes.delete(
  "/:idTax",
  param("id").isUUID().withMessage("Id no valido"),
  TaxesController.deleteTaxes
);

export default routeTaxes;
