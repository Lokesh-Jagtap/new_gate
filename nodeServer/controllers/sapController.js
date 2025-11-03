import axios from "axios";
import sapConfig from "../sapConfig.js";
import pool from "../config/db.js";
import https from "https";
import { getCSRFToken } from "../utils/csrfHelper.js";
import {
  extractSAPMessage,
  extractMessageFromXML,
  buildODataFilter,
} from "../utils/sapUtils.js";
import { formatSapDate, formatSapDuration } from "../utils/formatUtils.js";

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// Helper: fetch endpoint from DB
const getEndpoint = async (env, endpointName) => {
  const normalizedEnv =
    env === "production" ? "prod" : env === "qa" ? "qa" : "dev";
  // console.log("Fetching endpoint for:", normalizedEnv, endpointName);
  const result = await pool.query(
    `SELECT endpoint_url, method FROM api_endpoints WHERE env_id=$1 AND endpoint_name=$2 LIMIT 1`,
    [normalizedEnv, endpointName]
  );
  if (!result.rows.length)
    throw new Error(
      `Endpoint "${endpointName}" not found for env "${normalizedEnv}"`
    );
  return result.rows[0];
};

// ---------------- GET SAP PO Gate Entry ----------------
export const getGateEntry = async (req, res) => {
  try {
    const formData = req.body;
    const { endpoint_url, method } = await getEndpoint(
      process.env.NODE_ENV,
      "sap-get-gateentry"
    );
    if (method !== "GET")
      return res.status(400).json({ error: "Endpoint method mismatch" });

    const filterString = buildODataFilter(formData);
    let sapUrl = `${sapConfig.SAP_CONFIG.baseUrl}${endpoint_url}`;
    if (filterString) sapUrl += `?$filter=${encodeURIComponent(filterString)}`;

    const sapResponse = await axios.get(sapUrl, {
      headers: {
        Authorization: await sapConfig.getValidToken(),
        Accept: "application/json",
        "sap-client": sapConfig.SAP_CONFIG.client,
      },
      httpsAgent,
    });

    const sapData = sapResponse.data.d || sapResponse.data;
    const results = (sapData.results || []).map((item) => {
      const { __metadata, ...cleanItem } = item;
      Object.keys(cleanItem).forEach((key) => {
        const value = cleanItem[key];
        if (typeof value === "string" && value.startsWith("/Date("))
          cleanItem[key] = formatSapDate(value);
        else if (typeof value === "string" && value.startsWith("PT"))
          cleanItem[key] = formatSapDuration(value);
      });
      return cleanItem;
    });

    res.json(results);
  } catch (error) {
    let errorMessage = "Failed to fetch SAP data";
    if (error.response?.data)
      errorMessage =
        typeof error.response.data === "string"
          ? extractSAPMessage(error.response.data)
          : error.response.data.error?.message?.value ||
            error.response.data.message;
    else if (error.message?.includes("<"))
      errorMessage = extractSAPMessage(error.message);
    else if (error.message) errorMessage = error.message;
    res.status(error.response?.status || 500).json({ error: errorMessage });
  }
};

// ---------------- GET SAP PO ----------------
export const getPOData = async (req, res) => {
  const { po } = req.params;
  try {
    console.log("🔹 Received PO:", po);

    const { endpoint_url, method } = await getEndpoint(
      process.env.NODE_ENV || "dev",
      "sap-get-po"
    );
    console.log("🔹 DB Endpoint:", endpoint_url, "Method:", method);

    if (method !== "GET") {
      console.log("⚠️ Method mismatch:", method);
      return res.status(400).json({ error: "Endpoint method mismatch" });
    }

    // ✅ FIX: Add $expand to get TOITEM data
    const sapUrl = `${sapConfig.SAP_CONFIG.baseUrl}${endpoint_url}('${po}')?$expand=TOITEM`;
    console.log("🔹 Final SAP URL:", sapUrl);
    console.log("🔹 SAP Client:", sapConfig.SAP_CONFIG.client);

    const sapResponse = await axios.get(sapUrl, {
      headers: {
        Authorization: await sapConfig.getValidToken(),
        Accept: "application/json",
        "sap-client": sapConfig.SAP_CONFIG.client,
      },
      httpsAgent,
      timeout: 30000,
    });

    console.log("✅ SAP Response Status:", sapResponse.status);

    const rawData = sapResponse.data.d || sapResponse.data;

    // ✅ FIX: Transform response to match frontend expectations
    const transformedData = {
      header: {
        Lifnr: rawData.Lifnr || "",
        Name1: rawData.Name1 || "",
        Ebeln: rawData.Ebeln || "",
        Message: rawData.Message || "",
        SysTime: rawData.SysTime || "",
        VehIntime: rawData.VehIntime || "",
        VehicleNo: rawData.VehicleNo || "",
        InvNo: rawData.InvNo || "",
        LrNo: rawData.LrNo || "",
        Fcode: rawData.Fcode || "",
      },
      items: rawData.TOITEM?.results || [],
    };

    console.log(
      "✅ Transformed Data:",
      JSON.stringify(transformedData, null, 2)
    );
    console.log("✅ Sending response to frontend");

    res.json(transformedData);
  } catch (error) {
    console.error("❌ getPOData error - Full details:");
    console.error("  Message:", error.message);
    console.error("  Status:", error.response?.status);
    console.error("  SAP Response Data:", error.response?.data);

    let errorMessage = "Failed to fetch PO data";

    if (error.response?.data) {
      const data = error.response.data;

      if (typeof data === "string" && data.includes("<?xml")) {
        errorMessage = extractSAPMessage(data);
      } else if (data.error?.message?.value) {
        errorMessage = data.error.message.value;
      } else if (typeof data === "string") {
        errorMessage = data;
      } else if (data.message) {
        errorMessage = data.message;
      }
    } else if (error.code === "ECONNREFUSED") {
      errorMessage = "Cannot connect to SAP server. Connection refused.";
    } else if (error.code === "ETIMEDOUT") {
      errorMessage = "SAP request timed out. Server not responding.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error("  Final Error Message:", errorMessage);

    res.status(error.response?.status || 500).json({
      error: errorMessage,
      details: {
        status: error.response?.status,
        po: po,
      },
    });
  }
};

// ---------------- POST SAP PO ----------------
export const postPOData = async (req, res) => {
  try {
    const { po } = req.params;
    const { selectedItems, extraFields, headerData, fcode } = req.body;

    const { endpoint_url, method } = await getEndpoint(
      process.env.NODE_ENV,
      "sap-post-po"
    );
    if (method !== "POST")
      return res.status(400).json({ error: "Endpoint method mismatch" });

    // Build SAP payload
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, "0");
    const SysTime = `PT${pad(now.getHours())}H${pad(now.getMinutes())}M${pad(
      now.getSeconds()
    )}S`;
    const VehIntime = extraFields.vehicleInTime || SysTime;

    const sapPayload = {
      Ebeln: po,
      Lifnr: headerData.supplierCode,
      SysTime,
      Name1: headerData.supplierDesc,
      VehIntime,
      VehicleNo: extraFields.vehicleNo || "",
      InvNo: extraFields.supplierInvoice || "",
      LrNo: extraFields.lrNo || "",
      Fcode: fcode,
      TOITEM: {
        results: selectedItems.map((item) => ({
          Ebeln: po,
          Ebelp: item.Ebelp,
          Matnr: item.Matnr,
          Maktx: item.Maktx,
          Menge: item.Menge || "0.000",
        })),
      },
    };

    const { csrfToken, cookieHeader } = await getCSRFToken(
      "/sap/opu/odata/sap/ZGATE_ENTRY_SRV/"
    );
    const sapResponse = await axios({
      method: "POST",
      url: `${sapConfig.SAP_CONFIG.baseUrl}${endpoint_url}`,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/atom+xml",
        "x-csrf-token": csrfToken,
        Cookie: cookieHeader,
        Authorization: await sapConfig.getValidToken(),
        "sap-client": sapConfig.SAP_CONFIG.client,
      },
      data: sapPayload,
      httpsAgent,
    });

    const sapMessage = extractMessageFromXML(sapResponse.data);
    res.json({
      success: true,
      message:
        sapMessage ||
        `${fcode === "CHECK" ? "Checked" : "Posted"} successfully to SAP`,
      sapMessage,
      fcode,
    });
  } catch (error) {
    console.error("❌ postPOData SAP Error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    let errorMessage = "Failed to post PO data";

    if (error.response?.data) {
      const data = error.response.data;

      // 🔹 Handle XML response (even without <?xml header)
      if (typeof data === "string") {
        if (data.includes("<error") || data.includes("<message")) {
          errorMessage = extractSAPMessage(data);
        } else {
          errorMessage = data;
        }
      }
      // 🔹 Handle SAP JSON error format
      else if (data.error?.message?.value) {
        errorMessage = data.error.message.value;
      }
      // 🔹 Handle plain message field
      else if (data.message) {
        errorMessage = data.message;
      }
    }
    // 🔹 Handle rare case where Axios error.message contains XML
    else if (error.message?.includes("<")) {
      errorMessage = extractSAPMessage(error.message);
    }
    // 🔹 Fallback to normal message
    else if (error.message) {
      errorMessage = error.message;
    }

    console.error("🧾 Extracted SAP Error Message:", errorMessage);

    return res.status(error.response?.status || 500).json({
      success: false,
      error: errorMessage,
      details: error.response?.data || error.message,
    });
  }
};
// ---------------- Cancel Gate Entry ----------------
export const cancelGateEntry = async (req, res) => {
  try {
    const { GateentryNo, CancReason } = req.body;
    if (!GateentryNo || !CancReason)
      return res
        .status(400)
        .json({ error: "Gate Entry No and Cancel Reason are required" });

    const { endpoint_url, method } = await getEndpoint(
      process.env.NODE_ENV,
      "sap-cancel"
    );
    if (method !== "POST")
      return res.status(400).json({ error: "Endpoint method mismatch" });

    const sapPayload = { GateentryNo, Cancel: "X", CancReason };
    const { csrfToken, cookieHeader } = await getCSRFToken(
      "/sap/opu/odata/sap/ZGATE_ENTRY_SRV/"
    );

    const sapResponse = await axios({
      method: "POST",
      url: `${sapConfig.SAP_CONFIG.baseUrl}${endpoint_url}`,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-csrf-token": csrfToken,
        Cookie: cookieHeader,
        Authorization: await sapConfig.getValidToken(),
        "sap-client": sapConfig.SAP_CONFIG.client,
      },
      data: sapPayload,
      httpsAgent,
    });

    res.json({
      success: true,
      message: `Gate Entry ${GateentryNo} cancelled successfully`,
      data: sapResponse.data,
    });
  } catch (error) {
    let errorMessage = "Failed to cancel Gate Entry";
    if (error.response?.data) {
      const data = error.response.data;
      errorMessage =
        typeof data === "string"
          ? extractSAPMessage(data)
          : data.error?.message?.value || data.message || JSON.stringify(data);
    } else if (error.message?.includes("<"))
      errorMessage = extractSAPMessage(error.message);
    else if (error.message) errorMessage = error.message;
    res.status(error.response?.status || 500).json({
      error: errorMessage,
      details: error.response?.data || error.message,
    });
  }
};
