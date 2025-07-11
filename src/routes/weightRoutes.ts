import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { weightControllers } from "../controllers/weightControllers";

const routeWeight = Router();

// * Get all weight
routeWeight.get("/", weightControllers.getAllWeight);

// * Get tax by id
routeWeight.get(
  "/:id",
  param("id").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  weightControllers.getWeightById
);

// * Create a new weight
routeWeight.post(
  "/createWeight",
  body("peso")
    .notEmpty()
    .withMessage("Debes de agregar el peso"),
  body("abreviatura")
    .notEmpty()
    .withMessage("Debes de agregar la abreviatura"),
  handleInputErrors,
  weightControllers.createWeight
);

// * Update weight
routeWeight.patch(
  "/updateWeight/:id",
  param("id").isUUID().withMessage("Id no valido"),
  body("peso")
  .notEmpty()
  .withMessage("Debes de agregar el peso"),
body("abreviatura")
  .notEmpty()
  .withMessage("Debes de agregar la abreviatura"),
  handleInputErrors,
  weightControllers.updateWeight
);

routeWeight.delete(
  "/:idWeight",
  param("id").isUUID().withMessage("Id no valido"),
  weightControllers.deleteWeight
);

export default routeWeight;
