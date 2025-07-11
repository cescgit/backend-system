import { Router } from "express";
import {body, param} from "express-validator"
import { handleInputErrors } from "../middleware/validation";
import { UserController } from "../controllers/userController";
import { PermissionsController } from "../controllers/permissionsControllers";

const routeUsers = Router();


// * Get all users
routeUsers.get(
  "/",
  UserController.getAllUsers
);

// * Get user by id
routeUsers.get("/:id",
  param("id").isUUID().withMessage("Id no valido"),
  handleInputErrors,
    UserController.getUserById
);

// * Create a first user
routeUsers.post(
  "/createFirstUser",
  body("nombre_usuario")
    .notEmpty()
    .withMessage("Debes de agregar el nombre usuario"),
  body("cedula_usuario")
    .notEmpty()
    .withMessage("Debes de agregar la cédula del usuario"),
  body("celular_usuario")
    .notEmpty()
    .withMessage("Debes de agregar el celular usuario"),
  body("correo_usuario").isEmail().withMessage("Correo no valido"),
  body("password")
    .notEmpty()
    .withMessage("Debes de agregar la contraseña del usuario"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("La contraseña debe de tener al menos 8 caracteres"),
  body("tipo_usuario")
    .notEmpty()
    .withMessage("Debes de agregar el rol del usuario"),
  handleInputErrors,
  UserController.createFirstUser
);

// * Create a new user
routeUsers.post(
  "/createUser",  
  body("nombre_usuario")
    .notEmpty()
    .withMessage("Debes de agregar el nombre usuario"),
  body("cedula_usuario")
    .notEmpty()
    .withMessage("Debes de agregar la cédula del usuario"),
  body("celular_usuario")
    .notEmpty()
    .withMessage("Debes de agregar el celular usuario"),
  body("correo_usuario").isEmail().withMessage("Correo no valido"),
  body("password")
    .notEmpty()
    .withMessage("Debes de agregar la contraseña del usuario"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("La contraseña debe de tener al menos 8 caracteres"),
  body("tipo_usuario")
    .notEmpty()
    .withMessage("Debes de agregar el rol del usuario"),
  handleInputErrors,
  UserController.createUser
);

// * Update user data (own user)
routeUsers.patch(
  "/updateUser/:id",  
  body("celular_usuario")
    .notEmpty()
    .withMessage("Debes de agregar el celular usuario"),
  body("correo_usuario").isEmail().withMessage("Correo no valido"),
  handleInputErrors,
  UserController.updateDataUser
);

// * Update user data by Manager
routeUsers.patch(
  "/updateUserManager/:id",
  param("id").isUUID().withMessage("Id no valido"),
  body("nombre_usuario")
    .notEmpty()
    .withMessage("Debes de agregar el nombre del usuario"),
  body("cedula_usuario")
    .notEmpty()
    .withMessage("Debes de agregar la cédula del usuario"),
  body("celular_usuario")
    .notEmpty()
    .withMessage("Debes de agregar el celular usuario"),
  body("correo_usuario").isEmail().withMessage("Correo no valido"),
  body("tipo_usuario")
    .notEmpty()
    .withMessage("Debes de agregar el tipo de usuario"),
  body("estado")
    .notEmpty()
    .withMessage("Debes de agregar el estado del usuario"),
  handleInputErrors,
  UserController.updateUser
);

routeUsers.delete(
  "/:idUser",
  param("id").isUUID().withMessage("Id no valido"),
  UserController.deleteUser
);


// * Permisisons
// * Get permissions by id the user
routeUsers.get(
  "/permissionsUser/:id",
  param("id").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  PermissionsController.getPermissionsUsers
);

// * Create or Update permissions by id the user
routeUsers.post(
  "/createPermissions/:idUser",
  param("idUser").isUUID().withMessage("Id no valido"),
  handleInputErrors,
  PermissionsController.createPermissionsUser
);

export default routeUsers;
