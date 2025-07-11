import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { RemissionController } from "../controllers/remissionControllers";

const routeRemissions = Router();

// * Get all remissions
routeRemissions.get(
  "/",
  RemissionController.getAllRemissions
);

// * Get remission by id
routeRemissions.get(
  "/:id",
  param("id").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  RemissionController.getRemissionById
);

// * Create a new remission
routeRemissions.post(
  "/createRemission",  
  body("id_cliente").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  RemissionController.createRemission
);

// * Update remission by id
routeRemissions.patch(
  "/updateRemission/:id",
  param("id").isUUID().withMessage("Id no valido"),
  body("id_cliente").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  RemissionController.updateRemission
);

// * Delete product by id remission
routeRemissions.patch(
  "/:id",
  param("id").isUUID().withMessage("Id no valido"),
  body("id_producto").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  RemissionController.deleteProductInRemission
);

export default routeRemissions;
