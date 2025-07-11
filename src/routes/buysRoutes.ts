import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { BuysController } from "../controllers/buysControllers";

const routeBuys = Router();

// * Get all buys
routeBuys.get(
  "/",
  BuysController.getAllBuys
);

// * Get details buys by id
routeBuys.get(
  "/:id",
  param("id").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  BuysController.getDetailsBuysById
);

// * Create a new buys
routeBuys.post(
  "/createBuys",
  body("termino")
    .notEmpty()
    .withMessage("Debes de agregar el termino de la compra"),
  body("id_proveedor")
    .notEmpty()
    .withMessage("Debes de agregar el proveedor de la compra"),
  handleInputErrors,
  BuysController.createBuys
);

// * Update buys by id
// routeBuys.patch(
//   "/updateBuys/:id",
//   param("id").isUUID().withMessage("Id no valido"),
//   body("termino")
//     .notEmpty()
//     .withMessage("Debes de agregar el termino de la compra"),  
//   body("id_proveedor")
//     .notEmpty()
//     .withMessage("Debes de agregar el proveedor de la compra"),
//   handleInputErrors,
//   BuysController.updateBuys
// );

export default routeBuys;
