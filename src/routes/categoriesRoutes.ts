import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { CategoriesControllers } from "../controllers/categoriesControllers";

const routeCategories = Router();

// * Get all brands
routeCategories.get(
  "/",
  CategoriesControllers.getAllCategories
);

// * Get brand by id
routeCategories.get(
  "/:id",
  param("id").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  CategoriesControllers.getCategoriesById
);

// * Create a new category
routeCategories.post(
  "/createCategory",
  body("nombre_categoria").notEmpty().withMessage("Debes de agregar la categoría"),
  handleInputErrors,
  CategoriesControllers.createCategory
);

// * Update category by id
routeCategories.patch(
  "/updateCategory/:id",
  param("id").isUUID().withMessage("Id no valido"),
  body("nombre_categoria").notEmpty().withMessage("Debes de agregar la marca"),
  handleInputErrors,
  CategoriesControllers.updateBrand
);

routeCategories.delete(
  "/:idCategory",
  param("id").isUUID().withMessage("Id no valido"),
  CategoriesControllers.deleteCategory
);

export default routeCategories;
