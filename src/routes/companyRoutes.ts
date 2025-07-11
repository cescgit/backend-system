import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { CompanyController } from "../controllers/companyControllers";

const routeCompany = Router();

// * Get all information about the company
routeCompany.get(
  "/",
  CompanyController.getCompany
);

// * Get information about the company by id
routeCompany.get(
  "/:id",
  param("id").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  CompanyController.getCompanyById
);


// * Create information about the company
routeCompany.post(
  "/createCompany",
  body("nombre_empresa")
    .notEmpty()
    .withMessage("Debes de agregar el nombre de la empresa"),
  body("direccion_empresa")
    .notEmpty()
    .withMessage("Debes de agregar la dirección de la empresa"),
  body("ruc")
    .notEmpty()
    .withMessage("Debes de agregar el RUC de la empresa"),
  body("telefono_empresa")
    .notEmpty()
    .withMessage("Debes de agregar el Teléfono de la empresa"),
  body("celular_empresa")
    .notEmpty()
    .withMessage("Debes de agregar el Celular de la empresa"),
  body("correo_empresa")
    .notEmpty()
    .withMessage("Debes de agregar el Correo de la empresa"),
  handleInputErrors,
  CompanyController.createFirstCompany
);

// * Update information about the company
routeCompany.patch(
  "/updateCompany/:id",
  param("id").isUUID().withMessage("Id no valido"),
  body("nombre_empresa")
    .notEmpty()
    .withMessage("Debes de agregar el nombre de la empresa"),
  body("direccion_empresa")
    .notEmpty()
    .withMessage("Debes de agregar la dirección de la empresa"),
  body("ruc").notEmpty().withMessage("Debes de agregar el RUC de la empresa"),
  body("telefono_empresa")
    .notEmpty()
    .withMessage("Debes de agregar el Teléfono de la empresa"),
  body("celular_empresa")
    .notEmpty()
    .withMessage("Debes de agregar el Celular de la empresa"),
  body("correo_empresa")
    .notEmpty()
    .withMessage("Debes de agregar el Correo de la empresa"),
  handleInputErrors,
  CompanyController.updateCustomerType
);


export default routeCompany;
