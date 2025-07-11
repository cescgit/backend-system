import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { SalesQuoteController } from "../controllers/salesQuoteControllers";

const routeSalesQuote = Router();

// * Get all purchasse quotes
routeSalesQuote.get("/", SalesQuoteController.getAllSalesQuote);

// * Get purchase quote by id
routeSalesQuote.get(
  "/:id",
  param("id").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  SalesQuoteController.getDetailsSalesQuoteById
);

// * Create a new purchase quote
routeSalesQuote.post(
  "/createSalesQuote",
  body("termino")
    .notEmpty()
    .withMessage("Debes de agregar el termino de la cotización"),
  body("id_cliente")
    .notEmpty()
    .withMessage("Debes de agregar el cliente de la cotización"),
  handleInputErrors,
  SalesQuoteController.createSalesQuote
);

// * Update purchase quote by id
routeSalesQuote.patch(
  "/updateSalesQuote/:id",
  param("id").isUUID().withMessage("Id no valido"),
  body("termino")
    .notEmpty()
    .withMessage("Debes de agregar el termino de la cotización"),
  body("id_cliente")
    .notEmpty()
    .withMessage("Debes de agregar el cliente de la cotización"),
  handleInputErrors,
  SalesQuoteController.updateSalesQuote
);

// * Cancel purchase quote by id
routeSalesQuote.patch(
  "/:idSalesQuote",
  param("id").isUUID().withMessage("Id no valido"),
  SalesQuoteController.cancelSalesQuote
);

// * Reactivate purchase quote by id
routeSalesQuote.patch(
  "/:idSalesQuote/reactivate",
  param("id").isUUID().withMessage("Id no valido"),
  SalesQuoteController.reactivateSalesQuote
);

export default routeSalesQuote;
