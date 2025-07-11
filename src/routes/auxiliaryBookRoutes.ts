import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { AuxiliaryBookController } from "../controllers/auxiliaryBookControllers";

const routeAuxiliaryBook = Router();

// * Get all auxiliary books
routeAuxiliaryBook.get(
  "/",
  AuxiliaryBookController.getAllAuxiliaryBooks
);

// * Get auxiliary book by id
routeAuxiliaryBook.get(
  "/:id",
  param("id").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  AuxiliaryBookController.getAuxilaryBookById
);

// * Create a new auxiliari book
routeAuxiliaryBook.post(
  "/createAuxiliayrBook",  
  body("codigo").notEmpty().withMessage("Debes de agregar el código del libro auxiliar"),  
  handleInputErrors,
  AuxiliaryBookController.createAuxiliaryBook
);

// * Update auxiliari book by id
routeAuxiliaryBook.patch(
  "/updateAuxiliayrBook/:id",
  param("id").isUUID().withMessage("Id no valido"),
  body("codigo").notEmpty().withMessage("Debes de agregar el código del libro auxiliar"),
  handleInputErrors,
  AuxiliaryBookController.updateAuxiliaryBook
);

export default routeAuxiliaryBook;
