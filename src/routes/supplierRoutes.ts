import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { SupplierController } from "../controllers/supplierControllers";

const routeSupplier = Router();

// * Get all suppliers
routeSupplier.get(
  "/",
  SupplierController.getAllSuppliers
);

// * Get supplier by id
routeSupplier.get(
  "/:id",
  param("id").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  SupplierController.getSupplierById
);

// * Create a new supplier
routeSupplier.post(
  "/createSupplier",  
  body("nombre_proveedor")
    .notEmpty()
    .withMessage("Debes de agregar el nomnbre del proveedor"),
  body("direccion_proveedor")
    .notEmpty()
    .withMessage("Debes de agregar la dirección del proveedor"),
  body("correo_proveedor")
    .notEmpty()
    .withMessage("Debes de agregar el correo del proveedor"),
  handleInputErrors,
  SupplierController.createSupplier
);

// * Update tax by id
routeSupplier.patch(
  "/updateSupplier/:id",
  param("id").isUUID().withMessage("Id no valido"),  
  body("nombre_proveedor")
    .notEmpty()
    .withMessage("Debes de agregar el nomnbre del proveedor"),
  body("direccion_proveedor")
    .notEmpty()
    .withMessage("Debes de agregar la dirección del proveedor"),
  body("correo_proveedor")
    .notEmpty()
    .withMessage("Debes de agregar el correo del proveedor"),
  handleInputErrors,
  SupplierController.updateSupplier
);

routeSupplier.delete(
  "/:idSupplier",
  param("id").isUUID().withMessage("Id no valido"),
  SupplierController.deleteSupplier
);

export default routeSupplier;
