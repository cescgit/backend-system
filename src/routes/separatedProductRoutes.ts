import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { SeparatedProductController } from "../controllers/separatedProductControllers";

const routeSeparatedProduct = Router();

// * Get all separated products
routeSeparatedProduct.get("/", SeparatedProductController.getAllSeparatedProduct);

// * Get purchase quote by id
routeSeparatedProduct.get(
  "/:id",
  param("id").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  SeparatedProductController.getDetailsSeparatedProductById
);

// * Create a new separated product
routeSeparatedProduct.post(
  "/createSeparatedProducts",
  body("termino")
    .notEmpty()
    .withMessage("Debes de agregar el termino de la cotización"),
  body("id_cliente")
    .notEmpty()
    .withMessage("Debes de agregar el cliente de la cotización"),
  handleInputErrors,
  SeparatedProductController.createSeparatedProduct
);

// * Update separated product by id
routeSeparatedProduct.patch(
  "/updateSeparatedProduct/:id",
  param("id").isUUID().withMessage("Id no valido"),
  body("termino")
    .notEmpty()
    .withMessage("Debes de agregar el termino de la cotización"),
  body("id_cliente")
    .notEmpty()
    .withMessage("Debes de agregar el cliente de la cotización"),
  handleInputErrors,
  SeparatedProductController.updateSeparatedProduct
);

// * Cancel separated product by id
routeSeparatedProduct.patch(
  "/cancelSeparatedProduct/:id",
  param("id").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  SeparatedProductController.cancelRegisterSeparatedProductById
);

// * Restored separated product by id
routeSeparatedProduct.patch(
  "/restoredSeparatedProduct/:id",
  param("id").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  SeparatedProductController.restoredRegisterSeparatedProductById
);

// * Delete separated product by id
routeSeparatedProduct.patch(
  "/:id",
  param("id").isUUID().withMessage("Id no valido"),
  body("id_producto").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  SeparatedProductController.deleteProductSeparated
);

export default routeSeparatedProduct;
