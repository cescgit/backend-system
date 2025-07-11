import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { CustomerBalanceController } from "../controllers/customerBalanceControllers";

const routeCustomerBalance = Router();

// * Get all customer balance
routeCustomerBalance.get(
  "/",
  CustomerBalanceController.getAllCustomerBalance
);

// * Get customer by id not canceled
routeCustomerBalance.get(
  "/:id",
  param("id").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  CustomerBalanceController.getCustomerBalanceByIdDetails
);

// * Get customer balance by id customer details
routeCustomerBalance.get(
  "/customerBalanceDetails/:id",
  param("id").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  CustomerBalanceController.getCustomerBalanceByIdCustomerDetails
);

// * Get customer balance by id details supplier balance
routeCustomerBalance.get(
  "/:id/detailsBalanceCustomer/customerBalanceDetails",
  param("id").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  CustomerBalanceController.getDetailsByIdDetailsCustomerBalance
);

// * Create a new advance or payment customer balance
routeCustomerBalance.post(
  "/:id/createAdvanceOrPaymentCustomerBalance",  
  body("descripcion")
  .notEmpty()
  .withMessage("Debes de agregar una breve descripción del anticipo o pago"),
  handleInputErrors,
  CustomerBalanceController.createAdvanceOrPayment
);

// * Cancel and advance or payment customer balance
routeCustomerBalance.patch(
  "/:id/cancelAdvanceOrPaymentCustomerBalance",  
  body("descripcion_anulacion")
  .notEmpty()
  .withMessage("Debes de agregar una breve descripción de porque se anulo el anticipo o el pago..."),
  handleInputErrors,
  CustomerBalanceController.createCancelAdvanceOrPayment
);

export default routeCustomerBalance;
