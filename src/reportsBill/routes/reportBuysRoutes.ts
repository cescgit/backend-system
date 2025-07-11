import { Router } from "express";
import { handleInputErrors } from "../../middleware/validation";
import { param } from "express-validator";
import { reportBuysController } from "../reportController/reportBuysController";

const routeReportsBuys = Router();
// * Get report by id
routeReportsBuys.get("/:id", 
    param("id").isUUID().withMessage("Id no valido"),
    handleInputErrors,
    reportBuysController.getBuysReportById
);
export default routeReportsBuys