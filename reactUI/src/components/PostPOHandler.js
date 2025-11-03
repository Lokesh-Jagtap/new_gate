// frontend/src/services/postPOData.js
import API from "../services/api"; // ✅ centralized axios instance

export const postPOData = async (
  poNumber,
  formData,
  tableData,
  fetchedData,
  setLoading,
  setErrorMsg,
  fcode = "POST" // default operation
) => {
  // ---------------- Validate inputs ----------------
  if (!poNumber) {
    alert("Please enter a PO number");
    return;
  }

  // ✅ Required form fields
  const requiredFields = ["vehicleInTime", "supplierInvoice"];
  const missingFields = requiredFields.filter(
    (field) => !formData[field] || !formData[field].trim()
  );

  if (missingFields.length > 0) {
    alert(
      "Please fill all required fields: Vehicle In Time and Supplier Challan/Invoice No."
    );
    return;
  }

  // ✅ Validate at least one item is selected
  const selectedItems = tableData
    .filter((row) => row.selected)
    .map((row) => ({
      Ebelp: row.poItem,
      Matnr: row.materialCode,
      Maktx: row.materialDesc,
      Menge: row.quantity || "0.000",
    }));

  if (selectedItems.length === 0) {
    alert("Please select at least one row.");
    return;
  }

  // ✅ Convert vehicleInTime to SAP format (PTxxHxxM00S)
  const convertToSapTime = (timeStr) => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(":");
    return `PT${hours.padStart(2, "0")}H${minutes.padStart(2, "0")}M00S`;
  };

  const extraFields = {
    ...formData,
    vehicleInTime: convertToSapTime(formData.vehicleInTime),
  };

  try {
    setLoading(true);
    setErrorMsg("");

    // ---------------- API call ----------------
    const res = await API.post(`/sap-data/${poNumber}/post`, {
      selectedItems,
      extraFields,
      headerData: fetchedData,
      fcode,
    });

    // ---------------- Response handling ----------------
    if (!res.data?.success) {
      throw new Error(res.data?.error || `SAP ${fcode} operation failed`);
    }

    return {
      success: true,
      message: res.data.message,
      sapMessage: res.data.sapMessage,
      fcode,
    };
  } catch (err) {
    console.error(`SAP ${fcode} Error:`, err);

    let extractedMessage = "";

    // Case 1: Backend returned structured JSON error
    if (err.response?.data?.error) {
      extractedMessage = err.response.data.error;
    }

    // Case 2: Backend returned SAP XML response as string
    else if (
      typeof err.response?.data === "string" &&
      err.response.data.includes("<error")
    ) {
      const match = err.response.data.match(/<message[^>]*>([^<]+)<\/message>/);
      extractedMessage = match
        ? match[1]
        : "SAP returned an unknown XML error.";
    }

    // Case 3: Backend returned object with raw XML string
    else if (
      typeof err.response?.data === "object" &&
      typeof err.response.data?.error === "string" &&
      err.response.data.error.includes("<error")
    ) {
      const match = err.response.data.error.match(
        /<message[^>]*>([^<]+)<\/message>/
      );
      extractedMessage = match
        ? match[1]
        : "SAP returned an unknown structured XML error.";
    }

    // Case 4: Fallback for network or unknown issues
    if (!extractedMessage) {
      extractedMessage =
        err.message || `Failed to ${fcode.toLowerCase()} SAP data`;
    }

    // Show message in UI
    setErrorMsg(extractedMessage);

    return {
      success: false,
      error: extractedMessage,
    };
  } finally {
    setLoading(false);
  }
};
