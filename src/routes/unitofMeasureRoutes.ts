import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { unitOfMeasureControllers } from "../controllers/unitOfMeasureControllers";

const routeUnitOfMeasure = Router();

// * Get all Unit of Measurements
routeUnitOfMeasure.get("/", unitOfMeasureControllers.getAllUnitOfMeasurements);

// * Get tax by id
routeUnitOfMeasure.get(
  "/:id",
  param("id").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  unitOfMeasureControllers.getUnitOfMeasureById
);

// * Create a new Unit of Mesaure
routeUnitOfMeasure.post(
  "/createUnitOfMeasure",
  body("unidad_medida")
    .notEmpty()
    .withMessage("Debes de agregar la unidad de medida"),
  body("abreviatura")
    .notEmpty()
    .withMessage("Debes de agregar la abreviatura"),
  handleInputErrors,
  unitOfMeasureControllers.createUnitOfMeasure
);

// * Update unit of measure by id
routeUnitOfMeasure.patch(
  "/updateUnitOfMeasure/:id",
  param("id").isUUID().withMessage("Id no valido"),
  body("unidad_medida")
  .notEmpty()
  .withMessage("Debes de agregar la unidad de medida"),
body("abreviatura")
  .notEmpty()
  .withMessage("Debes de agregar la abreviatura"),
  handleInputErrors,
  unitOfMeasureControllers.updateUnitOfMeasure
);

routeUnitOfMeasure.delete(
  "/:idUnitOfMeasure",
  param("id").isUUID().withMessage("Id no valido"),
  unitOfMeasureControllers.deleteUnitOfMeasure
);

export default routeUnitOfMeasure;
