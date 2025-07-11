import { Router } from "express";
import { InventoryController } from "../controllers/inventoryControllers";

const routeInventory = Router();

// * Get all buys
routeInventory.get(
  "/",
  InventoryController.getAllInventory
);

export default routeInventory;