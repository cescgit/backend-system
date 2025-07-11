import { Router } from "express";
import { handleInputErrors } from "../../middleware/validation";
import { param } from "express-validator";
import { reportKardexController } from "../reportController/reportKardexController";

const routeReportsKardex = Router();
// * Get report by id product
routeReportsKardex.get("/report/prouct/:id", 
    param("id").isUUID().withMessage("Id no valido"),
    handleInputErrors,
    reportKardexController.getKardexReportById
);

// * Get report by range date
routeReportsKardex.get("/reportRangeDate/:startDate/:endDate",
    param("startDate").isDate().withMessage("Fecha no valida"),
    param("endDate").isDate().withMessage("Fecha no valida"),     
    handleInputErrors,
    reportKardexController.getKardexReportByRangeDate
);
export default routeReportsKardex