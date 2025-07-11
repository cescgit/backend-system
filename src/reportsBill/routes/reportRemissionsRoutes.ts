import { Router } from "express";
import { handleInputErrors } from "../../middleware/validation";
import { param } from "express-validator";
import { reportRemissionsController } from "../reportController/reportRemissionsController";

const routeReportRemissions = Router();
// * Get report by id
routeReportRemissions.get("/:id", 
    param("id").isUUID().withMessage("Id no valido"),
    handleInputErrors,
    reportRemissionsController.getRemissionsReportById
);
export default routeReportRemissions