import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { PreInvoicingControllers } from "../controllers/preInvoicingControllers";

const routePreInvoicing = Router();

// * Get all pre-invoicing
routePreInvoicing.get(
  "/",
  PreInvoicingControllers.getAllPreInvoicing
);

// * Get details pre-invoicing by id
routePreInvoicing.get(
  "/:id",
  param("id").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  PreInvoicingControllers.getPreInvoicingById
);

// * Create a new pre-invoincing
routePreInvoicing.post(
  "/createPreInvoicing",
  body("termino")
    .notEmpty()
    .withMessage("Debes de agregar el termino de la prefacturación"),
  handleInputErrors,
  PreInvoicingControllers.createPreInvoicing
);

// * Create a pre-invoicing from a sales quote
routePreInvoicing.post(
  "/createPreInvoicing/:idSalesQuote/salesQuote",
  param("idSalesQuote").isUUID().withMessage("Id no valido"),
  body("termino")
    .notEmpty()
    .withMessage("Debes de agregar el termino de la facturación"),
  handleInputErrors,
  PreInvoicingControllers.createPreInvoicingFromSalesQuote
);

// * Create a pre-invoicing from a separated product
routePreInvoicing.post(
  "/createPreInvoicing/:idSeparatedProduct/separatedProduct",
  param("idSeparatedProduct").isUUID().withMessage("Id no valido"),
  body("termino")
    .notEmpty()
    .withMessage("Debes de agregar el termino de la facturación"),
  handleInputErrors,
  PreInvoicingControllers.createPreInvoicingFromSeparatedProduct
);

export default routePreInvoicing;
