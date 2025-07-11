import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { TypeAccountController } from "../controllers/typeAccountControllers";

const routeTypeAccount = Router();

// * Get all type accounts
routeTypeAccount.get("/", TypeAccountController.getAllTypeAccount);

// * Get type account by id
routeTypeAccount.get(
  "/:id",
  param("id").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  TypeAccountController.getTypeAccountById
);

// * Create a new type account
routeTypeAccount.post(
  "/createTypeAccount",
  body("nombre")
    .notEmpty()
    .withMessage("Debes de agregar el tipo de cuenta"),  
  handleInputErrors,
  TypeAccountController.createTypeAccount
);

// * Update tax by id
routeTypeAccount.patch(
  "/updateTypeAccount/:id",
  param("id").isUUID().withMessage("Id no valido"),
  body("nombre")
    .notEmpty()
    .withMessage("Debes de agregar el tipo de cuenta"),  
  handleInputErrors,
  TypeAccountController.updateTypeAccount
);

export default routeTypeAccount;
