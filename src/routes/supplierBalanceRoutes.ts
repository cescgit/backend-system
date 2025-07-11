import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { SupplierBalanceController } from "../controllers/supplierBalanceControllers";

const routeSupplierBalance = Router();

// * Get all supplier balance
routeSupplierBalance.get(
  "/",
  SupplierBalanceController.getAllSupplierBalance
);

// * Get supplier balance by id not canceled
routeSupplierBalance.get(
  "/:id",
  param("id").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  SupplierBalanceController.getSupplierBalanceByIdDetails
);

// * Get supplier balance by id supplier details
routeSupplierBalance.get(
  "/supplierBalanceDetails/:id",
  param("id").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  SupplierBalanceController.getSupplierBalanceByIdSupplierDetails
);

// * Get supplier balance by id details supplier balance
routeSupplierBalance.get(
  "/:id/detailsBalanceSupplier/supplierBalanceDetails",
  param("id").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  SupplierBalanceController.getDetailsByIdDetailsSupplierBalance
);

// * Create a new brand
routeSupplierBalance.post(
  "/:id/createAdvanceOrPaymentSupplierBalance",  
  body("descripcion")
  .notEmpty()
  .withMessage("Debes de agregar una breve descripción del anticipo o pago"),
  handleInputErrors,
  SupplierBalanceController.createAdvanceOrPayment
);

// * Create a new brand
routeSupplierBalance.patch(
  "/:id/cancelAdvanceOrPaymentSupplierBalance",  
  body("descripcion_anulacion")
  .notEmpty()
  .withMessage("Debes de agregar una breve descripción de porque se anulo el anticipo o el pago..."),
  handleInputErrors,
  SupplierBalanceController.createCancelAdvanceOrPayment
);

export default routeSupplierBalance;
