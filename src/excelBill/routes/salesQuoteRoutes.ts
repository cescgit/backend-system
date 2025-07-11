import { Router } from "express";
import { handleInputErrors } from "../../middleware/validation";
import { param } from "express-validator";
import { salesQuotesControllers } from "../excelController/excelSalesQuotesControllers";

const routeReportsBuys = Router();

routeReportsBuys.get("/createExcel/:id",     
    salesQuotesControllers.getSalesQuotesExcel
);

export default routeReportsBuys