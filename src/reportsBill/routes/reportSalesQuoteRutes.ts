import { Router } from "express";
import { handleInputErrors } from "../../middleware/validation";
import { param } from "express-validator";
import { reportSalesQuoteController } from "../reportController/reportSalesQuoteController";

const routeReportsSalesQuote = Router();
// * Get report by id
routeReportsSalesQuote.get("/:id", 
    param("id").isUUID().withMessage("Id no valido"),
    handleInputErrors,
    reportSalesQuoteController.getSalesQuoteReportById
);
export default routeReportsSalesQuote