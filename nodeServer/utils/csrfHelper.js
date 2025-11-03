import axios from "axios";
import https from "https";
import sapConfig from "../sapConfig.js";

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export const getCSRFToken = async (endpoint) => {
  const config = {
    method: "GET",
    url: `${sapConfig.SAP_CONFIG.baseUrl}${endpoint}`,
    headers: {
      Authorization: await sapConfig.getValidToken(),
      "X-CSRF-Token": "Fetch",
      Accept: "application/json",
      "sap-client": sapConfig.SAP_CONFIG.client,
    },
    httpsAgent,
    withCredentials: true,
  };
  const response = await axios(config);
  const csrfToken = response.headers["x-csrf-token"];
  const setCookies = response.headers["set-cookie"];
  const cookieHeader = setCookies?.map((c) => c.split(";")[0]).join("; ");
  return { csrfToken, cookieHeader };
};
