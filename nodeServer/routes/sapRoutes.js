import express from "express";
import { getGateEntry, getPOData, postPOData, cancelGateEntry } from "../controllers/sapController.js";
import { auth } from "../middleware/auth.js";
import { perValidate } from "../middleware/perValidate.js";
import { body, param } from "express-validator";
import { validateRequest } from "../middleware/validateRequest.js";
const router = express.Router();

router.post(
    "/sap-get-gateentry",
    auth,
    perValidate(["admin", "user"]),
    validateRequest,
    getGateEntry
);
router.get(
  "/sap-data/:po",
  auth,
  param("po").isNumeric(),
  validateRequest,
  getPOData
);

router.post(
  "/sap-data/:po/post",
  auth,
  perValidate(["admin","user"]),
  validateRequest,
  postPOData
);

router.post(
  "/sap-cancel",
  auth,
  perValidate(["admin","superadmin"]),
  validateRequest,
  cancelGateEntry
);

export default router;
