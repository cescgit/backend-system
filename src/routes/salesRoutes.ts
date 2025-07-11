import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { SalesController } from "../controllers/salesControllers";

const routeSales = Router();

// * Get all buys
routeSales.get(
  "/",
  SalesController.getAllSales
);

// * Get details buys by id
routeSales.get(
  "/:id",
  param("id").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  SalesController.getDetailsSalesById
);

// * Create a new buys
routeSales.post(
  "/createBilling",
  body("termino")
    .notEmpty()
    .withMessage("Debes de agregar el termino de la facturación"),
  body("id_cliente")
    .notEmpty()
    .withMessage("Debes de agregar el cliente de la facturación"),
  handleInputErrors,
  SalesController.createSales
);

// * Create a sale from a sales quote
routeSales.post(
  "/createBilling/:idSalesQuote/salesQuote",
  param("idSalesQuote").isUUID().withMessage("Id no valido"),
  body("termino")
    .notEmpty()
    .withMessage("Debes de agregar el termino de la facturación"),
  body("id_cliente")
    .notEmpty()
    .withMessage("Debes de agregar el cliente de la facturación"),
  handleInputErrors,
  SalesController.createSalesFromSalesQuote
);

// * Create a sale from a separated product
routeSales.post(
  "/createBilling/:idSeparatedProduct/separatedProduct",
  param("idSeparatedProduct").isUUID().withMessage("Id no valido"),
  body("termino")
    .notEmpty()
    .withMessage("Debes de agregar el termino de la facturación"),
  body("id_cliente")
    .notEmpty()
    .withMessage("Debes de agregar el cliente de la facturación"),
  handleInputErrors,
  SalesController.createSalesFromSeparatedProduct
);

export default routeSales;
