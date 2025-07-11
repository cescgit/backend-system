import { Router } from "express";
import { handleInputErrors } from "../../middleware/validation";
import { param } from "express-validator";
import { reportPurchaseReturnController } from "../reportController/reportPurchaseReturnController";

const routeReportsPurchaseReturn = Router();
// * Get report by id
routeReportsPurchaseReturn.get("/:id", 
    param("id").isUUID().withMessage("Id no valido"),
    handleInputErrors,
    reportPurchaseReturnController.getPurchaseReturnReportById
);
export default routeReportsPurchaseReturn