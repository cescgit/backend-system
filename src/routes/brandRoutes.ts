import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { BrandController } from "../controllers/brandControllers";

const routeBrands = Router();

// * Get all brands
routeBrands.get(
  "/",
  BrandController.getAllBrands
);

// * Get brand by id
routeBrands.get(
  "/:id",
  param("id").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  BrandController.getBrandById
);

// * Create a new brand
routeBrands.post(
  "/createBrand",  
  body("nombre_marca").notEmpty().withMessage("Debes de agregar la marca"),
  handleInputErrors,
  BrandController.createBrand
);

// * Update brand by id
routeBrands.patch(
  "/updateBrand/:id",
  param("id").isUUID().withMessage("Id no valido"),
  body("nombre_marca").notEmpty().withMessage("Debes de agregar la marca"),
  body("descripcion")
    .notEmpty()
    .withMessage("Debes de agregar una breve descripción de la marca"),
  handleInputErrors,
  BrandController.updateBrand
);

routeBrands.delete(
  "/:idBrand",
  param("idBrand").isUUID().withMessage("Id no valido"),
  BrandController.deleteBrand
);

export default routeBrands;
