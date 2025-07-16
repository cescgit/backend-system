import express from 'express';
import dotenv from "dotenv";
import cors from "cors"
import morgan from 'morgan';
import { connectDB } from './config/db';
import { corsConfig } from './config/cors';

// * routes the data
import userRoutes from "./routes/userRoutes";
import brandRoutes from "./routes/brandRoutes";
import categoriesRoutes from './routes/categoriesRoutes';
import taxesRoutes from './routes/taxesRoutes';
import unitOfMeasureRoutes from './routes/unitofMeasureRoutes';
import weightRoutes from './routes/weightRoutes';
import productsRoutes from './routes/productRoutes';
import customerRoutes from './routes/customerRoutes';
import supplierRoutes from './routes/supplierRoutes';
import inventoryBuys from './routes/inventoryRoutes';
import authRoutes from './routes/authRoutes';
import dollarChangeRoues from './routes/dollarChangeRoutes';
import querysRoutes from './routes/querysRoutes';
import routeBuys from './routes/buysRoutes';
import routeSalesQuote from './routes/saleQuoteRoutes';
import routeSales from './routes/salesRoutes';
import routePurchaseReturn from './routes/purchaseReturnRoutes';
import routePreInvoincing from './routes/preInvoicingRoutes';
import routeKardex from './routes/kardexRoutes';
import companyRoutes from './routes/companyRoutes';
import accountingAccountRoutes from './routes/accountingAcountRoutes';
import typeAccountRoutes from './routes/typeAccountRoutes';
import auxiliaryBookRoutes from './routes/auxiliaryBookRoutes';
import accountingSourcesRoutes from './routes/accountingSourcesRoutes';
import supplierBalanceRoutes from './routes/supplierBalanceRoutes';
import customerBalanceRoutes from './routes/customerBalanceRoutes';
import remissionsRoutes from './routes/remissionRoutes';
import separatedProductRoutes from './routes/separatedProductRoutes';


// * routes for reporting
import routeReportsBuys from './reportsBill/routes/reportBuysRoutes';
import routeReportsPurchaseReturn from './reportsBill/routes/reportPurchaseReturnRoutes';
import routeReportsSalesQuote from './reportsBill/routes/reportSalesQuoteRutes';
import routeReportsKardex from './reportsBill/routes/reportKardexRoutes';
import routeReportsRemissions from './reportsBill/routes/reportRemissionsRoutes';
import routeReportsSales from './reportsBill/routes/reportSalesRoutes';

// * routes for excel
import routeExcelSalesQuote from "./excelBill/routes/salesQuoteRoutes";


dotenv.config()
connectDB()

const app = express();
app.use(cors(corsConfig))
app.use(morgan("dev"));
app.use(express.json());


// * Database routes
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api", querysRoutes);
app.use("/api/users", userRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/taxes", taxesRoutes);
app.use("/api/unitOfMeasurements", unitOfMeasureRoutes);
app.use("/api/weight", weightRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/dollarChange", dollarChangeRoues);
app.use("/api/customers", customerRoutes);
app.use("/api/buys", routeBuys);
app.use("/api/sales", routeSales);
app.use("/api/buys/reportBuys", routeReportsBuys);
app.use("/api/purchaseReturn", routePurchaseReturn);
app.use("/api/purchaseReturn/reportPurchaseReturn", routeReportsPurchaseReturn);
app.use("/api/inventory", inventoryBuys);
app.use("/api/remissions/reportRemissions", routeReportsRemissions);
app.use("/api/kardex", routeKardex);
app.use("/api/kardex/reportKardex", routeReportsKardex);
app.use("/api/salesQuote", routeSalesQuote);
app.use("/api/salesQuote/reportSalesQuote", routeReportsSalesQuote);
app.use("/api/salesQuote/excelSalesQuote", routeExcelSalesQuote);
app.use("/api/separatedProducts", separatedProductRoutes);
app.use("/api/billing", routeSales);
app.use("/api/billing/reportBilling", routeReportsSales);
app.use("/api/preInvoicing", routePreInvoincing);
app.use("/api/company", companyRoutes);
app.use("/api/accountingAccount", accountingAccountRoutes);
app.use("/api/typeAccount", typeAccountRoutes);
app.use("/api/auxiliaryBooksdgerRegister", auxiliaryBookRoutes);
app.use("/api/accountingSources", accountingSourcesRoutes);
app.use("/api/supplierBalance", supplierBalanceRoutes);
app.use("/api/customerBalance", customerBalanceRoutes);
app.use("/api/remissions", remissionsRoutes);


// * Routes reports
// app.use("/api/reports", reportPurchaseQuoteRoutes);

export default app;