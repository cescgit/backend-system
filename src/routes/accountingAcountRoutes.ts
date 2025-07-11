import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { AccountingAccountController } from "../controllers/accountingAccountControllers";

const routeAccountingAccount = Router();

// * Get all accounting account
routeAccountingAccount.get(
  "/",
  AccountingAccountController.getAllAccountingAccount
);

// * Get accounting account by id
routeAccountingAccount.get(
  "/:id",
  param("id").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  AccountingAccountController.getAccountingAccountById
);

// * Create a new accounting account
routeAccountingAccount.post(
  "/createAccountingAccount",  
  body("numero_cuenta").notEmpty().withMessage("Debes de agregar el número de cuenta"),
  body("descripcion").notEmpty().withMessage("Debes de agregar la descripción"),
  body("nivel_cuenta").notEmpty().withMessage("Debes de agregar el nivel de la cuenta"),
  handleInputErrors,
  AccountingAccountController.createAccountingAccount
);

// * Update accounting account by id
routeAccountingAccount.patch(
  "/updateAccountingAccount/:id",
  param("id").isUUID().withMessage("Id no valido"),
  body("numero_cuenta").notEmpty().withMessage("Debes de agregar el número de cuenta"),
  body("descripcion").notEmpty().withMessage("Debes de agregar la descripción"),
  body("nivel_cuenta").notEmpty().withMessage("Debes de agregar el nivel de la cuenta"),
  handleInputErrors,
  AccountingAccountController.updateAccountingAccount
);

export default routeAccountingAccount;
