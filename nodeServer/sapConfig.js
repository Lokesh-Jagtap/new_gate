// sapConfig.js
import http from "http";
import axios from "axios";
import https from "https";
import dotenv from "dotenv";

dotenv.config();

const SAP_CONFIG = {
  baseUrl: process.env.SAP_BASE_URL,
  client: process.env.SAP_CLIENT,
  username: process.env.SAP_USERNAME,
  password: process.env.SAP_PASSWORD,
};

// Self-signed cert handling
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const axiosInstance = axios.create({
  httpAgent: new http.Agent({ keepAlive: true, maxSockets: 10 }),
  httpsAgent,
  timeout: 20000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// ---------------- Auth ----------------
let authToken = null;
let tokenExpiry = null;

async function authenticateBasic() {
  const credentials = Buffer.from(
    `${SAP_CONFIG.username}:${SAP_CONFIG.password}`
  ).toString("base64");

  authToken = `Basic ${credentials}`;
  tokenExpiry = Date.now() + 8 * 60 * 60 * 1000; // valid 8h
  return authToken;
}

async function getValidToken() {
  if (!authToken || (tokenExpiry && Date.now() >= tokenExpiry)) {
    await authenticateBasic();
  }
  return authToken;
}

// ---------------- CSRF Token ----------------
async function getCSRFToken() {
  const token = await getValidToken();
  const response = await axiosInstance({
    method: "GET",
    url: `${SAP_CONFIG.baseUrl}/sap/opu/odata/sap/ZGATE_ENTRY_SRV/`,
    headers: {
      Authorization: token,
      "X-CSRF-Token": "Fetch",
      "sap-client": SAP_CONFIG.client,
    },
  });

  return {
    csrfToken: response.headers["x-csrf-token"],
    cookieHeader: response.headers["set-cookie"]
      ?.map((c) => c.split(";")[0])
      .join("; "),
  };
}

// ---------------- SAP API Call ----------------
async function callSAPAPI(endpoint, method = "GET", data = null, additionalConfig = {}) {
  try {
    const token = await getValidToken();
    const config = {
      method: method.toUpperCase(),
      url: `${SAP_CONFIG.baseUrl}${endpoint}`,
      headers: {
        Authorization: token,
        Accept: "application/json",
        "Content-Type": "application/json",
        "sap-client": SAP_CONFIG.client,
        ...additionalConfig.headers,
      },
      httpsAgent,
      timeout: 30000,
      ...additionalConfig,
    };

    if (data && ["POST", "PATCH", "PUT"].includes(method.toUpperCase())) {
      config.data = data;
    }

    // console.log(`🔄 SAP API Call: ${method.toUpperCase()} ${endpoint}`);
    const response = await axiosInstance(config);

    let responseData = response.data;
    if (responseData?.d) {
      responseData = responseData.d.results || responseData.d;
    }

    return responseData;
  } catch (error) {
    // console.error(`❌ SAP API call failed: ${method} ${endpoint}`);
    // console.error("Error details:", error.response?.data || error.message);

    const sapMessage =
      error.response?.data?.error?.message?.value ||
      (typeof error.response?.data === "string"
        ? error.response.data
        : JSON.stringify(error.response?.data || {}));

    const err = new Error(
      `SAP API Error: ${error.response?.status || 500} - ${sapMessage}`
    );
    if (error.response) err.response = error.response;
    throw err;
  }
}

// ---------------- Connection Check ----------------
async function checkSAPConnection() {
  try {
    const token = await getValidToken();
    const response = await axios({
      method: "GET",
      url: `${SAP_CONFIG.baseUrl}/sap/public/ping`,
      headers: {
        Authorization: token,
        Accept: "application/json",
        "sap-client": SAP_CONFIG.client,
      },
      httpsAgent,
      timeout: 10000,
    });

    return {
      success: true,
      status: response.status,
      message: "SAP base URL is reachable.",
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 500,
      message:
        error.code === "ENOTFOUND"
          ? "SAP host not found."
          : error.code === "ECONNREFUSED"
          ? "Connection refused. Port may be closed."
          : error.message,
    };
  }
}

export default {
  SAP_CONFIG,
  getValidToken,
  getCSRFToken,
  callSAPAPI,
  checkSAPConnection,
};
