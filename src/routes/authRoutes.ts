import { Router } from "express";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { AuthController } from "../controllers/authControllers";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post(
  "/confirm-account",
  body("token").notEmpty().withMessage("El token no puede ir vacio"),
  handleInputErrors,
  AuthController.confirmAccount
);

router.post(
  "/login",
  body("correo_usuario")
    .isEmail()
    .withMessage("Debes de agregar el correo para iniciar sesión"),
  body("password")
    .notEmpty()
    .withMessage("Debes de agregar la contraseña para iniciar sesión"),
  handleInputErrors,
  AuthController.login
);

router.post(
  "/request-code",
  body("correo_usuario").isEmail().withMessage("Correo no válido"),
  handleInputErrors,
  AuthController.requestConfirmationCode
);

router.post(
  "/forgot-password",
  body("correo_usuario").isEmail().withMessage("Correo no válido"),
  handleInputErrors,
  AuthController.forgotPassword
);

router.post(
  "/validate-token",
  body("token").notEmpty().withMessage("El token no puede ir vacio"),
  handleInputErrors,
  AuthController.validateToken
);

router.post(
  "/update-password/:token",
  param("token").isNumeric().withMessage("Token no válido"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("La contraseña debe de tener al menos 8 caracteres"),
  body("password_confirmation")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Las contraseñas no son iguales");
      }
      return true;
    }),
  handleInputErrors,
  AuthController.updatePasswordWithToken
);

router.get("/user", authenticate, AuthController.user);

export default router;
