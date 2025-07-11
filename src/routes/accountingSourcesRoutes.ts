import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { AccountingSourcesController } from "../controllers/accountingSourcesControllers";

const routeAuxiliaryBook = Router();

// * Get all accounting sources
routeAuxiliaryBook.get(
  "/",
  AccountingSourcesController.getAllAccountingSources
);

// * Get accounting sources by id
routeAuxiliaryBook.get(
  "/:id",
  param("id").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  AccountingSourcesController.getAccountingSourcesById
);

// * Create a new accounting sources
routeAuxiliaryBook.post(
  "/createAccountingSources",  
  body("codigo").notEmpty().withMessage("Debes de agregar el código del libro auxiliar"),  
  handleInputErrors,
  AccountingSourcesController.createAccountingSources
);

// * Update accounting sources by id
routeAuxiliaryBook.patch(
  "/updateAccountingSources/:id",
  param("id").isUUID().withMessage("Id no valido"),
  body("codigo").notEmpty().withMessage("Debes de agregar el código del libro auxiliar"),
  handleInputErrors,
  AccountingSourcesController.updateAccountingSources
);

export default routeAuxiliaryBook;
