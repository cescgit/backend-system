import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { ProductControllers } from "../controllers/productControllers";

const routeProducts = Router();

// * Get all Products
routeProducts.get(
  "/",
  ProductControllers.getAllProducts
);

// * Get peoduct by id
routeProducts.get(
  "/:id",
  param("id").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  ProductControllers.getProductById
);

// * Create new product
routeProducts.post(
  "/createProduct",
  body("codigo")
    .notEmpty()
    .withMessage("Debes de agregar el código del producto"),
  body("nombre_producto")
    .notEmpty()
    .withMessage("Debes de agregar el nombre del producto"),
  body("precio_compra")
    .notEmpty()
    .withMessage("Debes de agregar el precio del producto"),
  body("id_marca")
    .notEmpty()
    .withMessage("Debes de agregar la marca de este producto"),
  body("id_categoria")
    .notEmpty()
    .withMessage("Debes de agregar la categoría de este producto"),
  handleInputErrors,
  ProductControllers.createProduct
);


// * Update product by id
routeProducts.patch(
  "/updateProduct/:id",
  param("id").isUUID().withMessage("Id no valido"),
  body("codigo")
    .notEmpty()
    .withMessage("Debes de agregar el código del producto"),
  body("nombre_producto")
    .notEmpty()
    .withMessage("Debes de agregar el nombre del producto"),
  body("precio_compra")
    .notEmpty()
    .withMessage("Debes de agregar el precio del producto"),
  body("id_marca")
    .notEmpty()
    .withMessage("Debes de agregar la marca de este producto"),
  body("id_categoria")
    .notEmpty()
    .withMessage("Debes de agregar la categoría de este producto"),
  handleInputErrors,
  ProductControllers.updateProduct
);

routeProducts.delete(
  "/:idProduct",
  param("id").isUUID().withMessage("Id no valido"),
  ProductControllers.deleteProduct
);

export default routeProducts;
