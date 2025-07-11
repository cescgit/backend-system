import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { PurchaseReturnController } from "../controllers/purchaseReturnControllers";

const routePurchaseReturn = Router();

// * Get all purchase return
routePurchaseReturn.get(
  "/",
  PurchaseReturnController.getAllPurchaseReturn
);

// * Get details purchase return by id
routePurchaseReturn.get(
  "/:id",
  param("id").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  PurchaseReturnController.getDetailsPurchaseReturnById
);

// * Create a new purchase return
routePurchaseReturn.post(
  "/createPurchaseReturn",
  body("termino")
    .notEmpty()
    .withMessage("Debes de agregar el termino de la compra"),
  body("id_proveedor")
    .notEmpty()
    .withMessage("Debes de agregar el proveedor de la compra"),
  handleInputErrors,
  PurchaseReturnController.createPurchaseReturn
);

export default routePurchaseReturn;
