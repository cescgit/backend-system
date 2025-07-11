import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { CustomerTypeController } from "../controllers/customerControllers";

const routeCustomer = Router();

// * Get all taxes
routeCustomer.get("/", CustomerTypeController.getAllCustomer);

// * Get tax by id
routeCustomer.get(
  "/:id",
  param("id").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  CustomerTypeController.geCustomerById
);

// * Create a new customer
routeCustomer.post(
  "/createCustomer",
  body("nombre_cliente")
    .notEmpty()
    .withMessage("Debes de agregar el código del cliente"),
  body("celular_cliente")
    .notEmpty()
    .withMessage("Debes de agregar el código del cliente"),
  handleInputErrors,
  CustomerTypeController.createCustomer
);

// * Update customer by id
routeCustomer.patch(
  "/updateCustomer/:id",
  param("id").isUUID().withMessage("Id no valido"),
  body("nombre_cliente")
    .notEmpty()
    .withMessage("Debes de agregar el código del cliente"),
  body("celular_cliente")
    .notEmpty()
    .withMessage("Debes de agregar el código del cliente"),
  handleInputErrors,
  CustomerTypeController.updateCustomer
);

routeCustomer.delete(
  "/:idCustomer",
  param("id").isUUID().withMessage("Id no valido"),
  CustomerTypeController.deleteCustomer
);

export default routeCustomer;
