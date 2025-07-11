import { Router } from "express";
import { handleInputErrors } from "../../middleware/validation";
import { param } from "express-validator";
import { reportSalesController } from "../reportController/reportSalesControllers";

const routeReportsSales = Router();
// * Get report by id
routeReportsSales.get("/:id", 
    param("id").isUUID().withMessage("Id no valido"),
    handleInputErrors,
    reportSalesController.getSalesReportById
);
export default routeReportsSales