import React, { useState } from "react";
import Header from "./Header";
import { Search, Save, CheckSquare, Square } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { postPOData } from "./PostPOHandler";
import "bootstrap/dist/css/bootstrap.min.css";
import API from "../services/api";

// Vehicle regex (handles old, modern, BH, special series)
const vehicleRegex =
  /^(?:[A-Z]{2}\d{2}[A-Z]{1,2}\d{1,4}|(?:2[1-9]|[3-9]\d)BH\d{4}[A-HJ-NP-Z]{1,2}|[A-Z]{3}\d{1,4}|[A-Z]{2}\d{1,4})$/;
// Vehicle No. regex – allows Indian formats or free-text up to 15 chars
const textVehicleRegex = /^[A-Z0-9 ]{1,20}$/;

// PO Number regex (exactly 10 digits)
const poRegex = /^[0-9]{10}$/;

// Supplier Invoice regex (1-10 alphanumeric characters, not all zeros)
const supplierInvoiceRegex = /^(?!0+$)[A-Z0-9]{1,10}$/;

const Dashboard = () => {
  const [poNumber, setPoNumber] = useState("");
  const [fetchedData, setFetchedData] = useState({
    supplierCode: "",
    supplierDesc: "",
  });
  const [formData, setFormData] = useState({
    vehicleInTime: "",
    vehicleNo: "",
    supplierInvoice: "",
    lrNo: "",
  });
  const [tableData, setTableData] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("");
  const [inputWarnings, setInputWarnings] = useState({});

  const navigate = useNavigate();

  // Validation function
  const validateField = (field, value) => {
    // --- PO Number ---
    if (field === "poNumber") {
      return poRegex.test(value);
    }

    // --- Vehicle In Time (must not be empty) ---
    if (field === "vehicleInTime") {
      return !!value.trim();
    }

    // --- Vehicle No. (optional; validate only if filled) ---
    if (field === "vehicleNo") {
      if (!value.trim()) return true; // optional when empty
      return vehicleRegex.test(value) || textVehicleRegex.test(value);
    }

    // --- Supplier Invoice (optional; validate only if filled) ---
    if (field === "supplierInvoice") {
      if (!value.trim()) return true;
      return supplierInvoiceRegex.test(value);
    }

    // --- LR No. (optional; validate only if filled) ---
    if (field === "lrNo") {
      if (!value.trim()) return true; // ✅ Empty is valid
      const isAllZeros = /^0+$/.test(value);
      return value.length >= 1 && value.length <= 16 && !isAllZeros;
    }

    // --- Quantity (must be numeric) ---
    if (field === "quantity") {
      return /^\d+(\.\d+)?$/.test(value);
    }

    // --- Default (valid) ---
    return true;
  };

  // Handle form inputs, field cleaning & validation
  const handleInputChange = (field, value) => {
    let cleanedValue = value;
    let hasSymbols = false;

    if (field === "vehicleNo") {
      cleanedValue = cleanedValue.toUpperCase();

      // Check if it matches free-text pattern
      if (textVehicleRegex.test(cleanedValue)) {
        // Preserve single spaces (normalize)
        cleanedValue = cleanedValue.replace(/\s+/g, " ");
      } else {
        // Remove all spaces for Indian vehicle numbers
        cleanedValue = cleanedValue.replace(/\s+/g, "");
      }
    }

    if (field === "supplierInvoice") {
      hasSymbols = /[^A-Z0-9]/i.test(cleanedValue);
      cleanedValue = cleanedValue.toUpperCase().replace(/[^A-Z0-9]/g, "");
      
      if (hasSymbols) {
        setInputWarnings((prev) => ({ ...prev, supplierInvoice: true }));
        setTimeout(() => {
          setInputWarnings((prev) => ({ ...prev, supplierInvoice: false }));
        }, 3000);
      }
    }

    if (field === "lrNo") {
      hasSymbols = /[^A-Z0-9]/i.test(cleanedValue);
      cleanedValue = cleanedValue.toUpperCase().replace(/[^A-Z0-9]/g, "");
      
      if (hasSymbols) {
        setInputWarnings((prev) => ({ ...prev, lrNo: true }));
        setTimeout(() => {
          setInputWarnings((prev) => ({ ...prev, lrNo: false }));
        }, 3000);
      }
    }

    setFormData((prev) => ({ ...prev, [field]: cleanedValue }));

    let isValid = true;
    if (field === "poNumber") {
      isValid = poRegex.test(cleanedValue);
    } else if (
      ["vehicleInTime", "vehicleNo", "supplierInvoice", "lrNo"].includes(field)
    ) {
      isValid = !cleanedValue.trim() || validateField(field, cleanedValue);
    }

    setFormErrors((prev) => ({ ...prev, [field]: !isValid }));
  };

  // Handle PO number input
  const handleSearchChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    setPoNumber(val);
    setFormErrors((prev) => ({
      ...prev,
      poNumber: !validateField("poNumber", val),
    }));
  };

  // Fetch PO data
  const fetchPOData = async () => {
    if (!poNumber) {
      setPopupMessage("Please enter a PO number");
      setPopupType("error");
      return;
    }
    setIsFetching(true);

    try {
      const response = await API.get(`/sap-data/${poNumber}`);
      const data = response.data;

      if (!data.header) {
        throw new Error(`No data found for PO: ${poNumber}`);
      }

      setFetchedData({
        supplierCode: data.header.Lifnr || "N/A",
        supplierDesc: data.header.Name1 || "N/A",
      });

      setTableData(
        (data.items || []).map((item, idx) => ({
          id: idx + 1,
          poItem: item.Ebelp,
          materialCode: item.Matnr,
          materialDesc: item.Maktx,
          quantity: item.Menge || "",
          selected: false,
        }))
      );

      setPopupMessage(`PO ${poNumber} fetched successfully!`);
      setPopupType("success");
    } catch (err) {
      console.error("Fetch PO Error:", err);

      setFetchedData({ supplierCode: "N/A", supplierDesc: "N/A" });
      setTableData([]);

      let friendlyMsg =
        err.response?.data?.error ||
        "Something went wrong while fetching data. Please try again.";

      if (err.message.includes("ETIMEDOUT")) {
        friendlyMsg =
          "⏳ Connection timed out. Please check your network or try again later.";
      } else if (err.message.includes("Network Error")) {
        friendlyMsg =
          "⚠️ Unable to reach the server. Please ensure the backend is running.";
      } else if (err.message.includes("No data found")) {
        friendlyMsg = err.message;
      }

      setPopupMessage(friendlyMsg);
      setPopupType("error");
    } finally {
      setIsFetching(false);
    }
  };

  const handleTableInputChange = (rowId, value) => {
    const trimmedValue = value.trim();
    setTableData((prevData) =>
      prevData.map((row) => {
        if (row.id === rowId) {
          const regex = /^\d*(\.\d{0,3})?$/;
          const isValid = regex.test(trimmedValue);
          return {
            ...row,
            quantity: trimmedValue,
            error: !isValid && trimmedValue !== "",
          };
        }
        return row;
      })
    );
  };

  const toggleRowSelection = (id) => {
    setTableData((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, selected: !row.selected } : row
      )
    );
  };

  const toggleSelectAll = () => {
    const allSelected = tableData.every((row) => row.selected);
    setTableData((prev) =>
      prev.map((row) => ({ ...row, selected: !allSelected }))
    );
  };

  // Submit form (Fetch PO items)
  const handleFormSubmit = async () => {
    const errors = {};

    // Mandatory fields
    if (!validateField("poNumber", poNumber)) errors.poNumber = true;
    if (!formData.vehicleInTime) errors.vehicleInTime = true;
    if (!formData.supplierInvoice) {
      errors.supplierInvoice = true;
    } else if (!validateField("supplierInvoice", formData.supplierInvoice)) {
      errors.supplierInvoice = true;
    }

    // Optional fields (validate only if filled)
    ["vehicleNo", "lrNo"].forEach((field) => {
      const value = formData[field];
      if (value && !validateField(field, value)) {
        errors[field] = true;
      }
    });

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      setPopupMessage("Please fill all mandatory fields correctly.");
      setPopupType("error");
      return;
    }

    // Proceed to fetch PO data
    await fetchPOData();
  };

  const allSelected = tableData.every((row) => row.selected);

  const handlePost = async () => {
    // Filter only selected rows
    const selectedRows = tableData.filter((row) => row.selected);

    if (selectedRows.length === 0) {
      setPopupMessage("Please select at least one row to post.");
      setPopupType("error");
      return;
    }

    // Validate only selected rows
    const validatedRows = selectedRows.map((row) => {
      const value = row.quantity?.trim();
      const quantityRegex = /^\d+(\.\d{1,3})?$/;
      const isValidFormat = quantityRegex.test(value);
      const numericValue = parseFloat(value);

      let error = false;
      let errorMsg = "";

      if (!value) {
        error = true;
        errorMsg = "Please enter quantity.";
      } else if (isNaN(numericValue)) {
        error = true;
        errorMsg = "Quantity must be a valid number.";
      } else if (numericValue <= 0) {
        error = true;
        errorMsg = "Quantity must be greater than 0.";
      } else if (!isValidFormat) {
        error = true;
        errorMsg = "Quantity can have maximum 3 digits after decimal.";
      }

      return { ...row, error, errorMsg };
    });

    // Merge validation results back into full table
    const updatedTable = tableData.map((row) => {
      const validated = validatedRows.find((r) => r.id === row.id);
      return validated ? validated : { ...row, error: false, errorMsg: "" };
    });

    setTableData(updatedTable);

    // If any selected row has an error, stop submission
    if (validatedRows.some((r) => r.error)) {
      setPopupMessage("Please correct errors in selected rows before posting.");
      setPopupType("error");
      return;
    }

    setIsPosting(true);

    try {
      const result = await postPOData(
        poNumber,
        formData,
        validatedRows,
        fetchedData,
        setIsPosting,
        setErrorMsg,
        "POST"
      );

      if (result) {
        if (result.success) {
          setPopupMessage(result.message);
          setPopupType("success");
          setTableData((prev) =>
            prev.map((row) => ({ ...row, selected: false, error: false }))
          );
        } else {
          setPopupMessage(result.error);
          setPopupType("error");
        }
      }
    } catch (error) {
      setPopupMessage(error.message || "Unexpected error occurred.");
      setPopupType("error");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="min-vh-100 bg-light">
      <Header title="Dashboard" />
      <main className="container py-4" style={{ marginTop: "80px" }}>
        {/* Form Section */}
        <div className="bg-white rounded shadow p-4 mb-4">
          <div className="row g-3 mb-4">
            <div className="col-lg-4">
              <label className="form-label small">Enter PO Number</label>
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <Search size={16} className="text-muted" />
                </span>
                <input
                  type="text"
                  value={poNumber}
                  onChange={handleSearchChange}
                  className={`form-control ${
                    formErrors.poNumber
                      ? "is-invalid"
                      : poNumber
                      ? "border-success border-2"
                      : ""
                  }`}
                  maxLength={10}
                />
                {formErrors.poNumber && (
                  <div className="invalid-feedback">
                    PO Number must be exactly 10 digits.
                  </div>
                )}
              </div>
            </div>
            <div className="col-lg-4">
              <label className="form-label small">Supplier Code</label>
              <input
                type="text"
                className="form-control bg-light"
                value={fetchedData.supplierCode}
                readOnly
              />
            </div>
            <div className="col-lg-4">
              <label className="form-label small">Supplier Description</label>
              <input
                type="text"
                className="form-control bg-light"
                value={fetchedData.supplierDesc}
                readOnly
              />
            </div>
          </div>
          <div className="row g-3">
            {[
              {
                label: "Vehicle In Time",
                field: "vehicleInTime",
                type: "time",
                mandatory: true,
              },
              { label: "Vehicle No.", field: "vehicleNo", type: "text" },
              {
                label: "Supplier Challan/Invoice No.",
                field: "supplierInvoice",
                type: "text",
                mandatory: true,
              },
              { label: "LR No.", field: "lrNo", type: "text" },
            ].map((field) => (
              <div className="col-sm-6 col-lg-3" key={field.field}>
                <label className="form-label small">
                  {field.mandatory && <span className="text-danger">* </span>}
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={formData[field.field]}
                  onChange={(e) =>
                    handleInputChange(field.field, e.target.value)
                  }
                  onBlur={() => {
                    if (field.field === "lrNo" && formData.lrNo.trim()) {
                      setFormData((prev) => ({
                        ...prev,
                        lrNo: prev.lrNo.padStart(16, "0"),
                      }));
                    }
                  }}
                  className={`form-control ${
                    formErrors[field.field]
                      ? "is-invalid"
                      : formData[field.field]
                      ? "border-success border-2"
                      : ""
                  }`}
                  maxLength={
                    field.field === "vehicleNo"
                      ? 12
                      : field.field === "supplierInvoice"
                      ? 10
                      : field.field === "lrNo"
                      ? 16
                      : 20
                  }
                />
                {formErrors[field.field] && (
                  <div className="invalid-feedback">
                    {field.field === "vehicleNo"
                      ? "Invalid vehicle number format."
                      : field.field === "supplierInvoice"
                      ? formData[field.field].match(/^0+$/)
                        ? "All zeros not allowed."
                        : "Supplier Invoice must be 1-10 alphanumeric characters."
                      : field.field === "lrNo"
                      ? formData[field.field].match(/^0+$/)
                        ? "All zeros not allowed."
                        : "LR No. must be 1–16 alphanumeric characters."
                      : "This field is invalid."}
                  </div>
                )}
                {inputWarnings[field.field] && (
                  <div className="text-warning small mt-1">
                    ⚠️ Symbols removed. Only alphanumeric characters allowed.
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <button
              onClick={handleFormSubmit}
              className="btn btn-primary d-inline-flex align-items-center"
              disabled={isFetching}
            >
              {isFetching ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Fetching...
                </>
              ) : (
                <>
                  <Save size={16} className="me-2" /> Fetch
                </>
              )}
            </button>
          </div>
        </div>
        {/* Table Section */}
        <div className="bg-white rounded shadow">
          <div className="p-3 border-bottom">
            <h5 className="mb-0">Purchase Order Items</h5>
          </div>
          <div
            className="table-responsive overflow-auto"
            style={{ maxHeight: "350px" }}
          >
            <table className="table align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Select</th>
                  <th>PO Item</th>
                  <th>Material Code</th>
                  <th>Material Description</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {tableData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted">
                      {errorMsg
                        ? errorMsg
                        : "No items found. Enter PO number and submit form."}
                    </td>
                  </tr>
                ) : (
                  tableData.map((row) => (
                    <tr
                      key={row.id}
                      className={row.selected ? "table-primary" : ""}
                    >
                      <td>
                        <button
                          onClick={() => toggleRowSelection(row.id)}
                          className="btn btn-sm btn-link p-0"
                        >
                          {row.selected ? (
                            <CheckSquare size={16} className="text-primary" />
                          ) : (
                            <Square size={16} className="text-secondary" />
                          )}
                        </button>
                      </td>
                      <td>{row.poItem}</td>
                      <td>{row.materialCode}</td>
                      <td>{row.materialDesc}</td>
                      <td>
                        <input
                          type="text"
                          value={row.quantity}
                          onChange={(e) =>
                            handleTableInputChange(row.id, e.target.value)
                          }
                          className={`form-control form-control-sm ${
                            row.selected && row.error
                              ? "is-invalid border-danger border-2"
                              : ""
                          }`}
                          disabled={!row.selected}
                        />
                        {row.selected && row.error && (
                          <div className="invalid-feedback">{row.errorMsg}</div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {tableData.length > 0 && (
            <div className="p-3 border-top d-flex justify-content-between align-items-center">
              <button
                className="btn btn-secondary btn-sm"
                onClick={toggleSelectAll}
              >
                {allSelected ? "Deselect All" : "Select All"}
              </button>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-success btn-sm"
                  onClick={handlePost}
                  disabled={isPosting}
                >
                  {isPosting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Posting...
                    </>
                  ) : (
                    "Post"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Popup Modal for Success/Error */}
        {popupMessage && (
          <>
            <div
              className="modal-backdrop fade show"
              style={{
                backdropFilter: "blur(4px)",
                backgroundColor: "rgba(0,0,0,0.5)",
              }}
            ></div>
            <div className="modal fade show d-block" tabIndex="-1">
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg rounded-3">
                  <div
                    className={`modal-header ${
                      popupType === "success" ? "bg-success" : "bg-danger"
                    } text-white rounded-top-3`}
                  >
                    <h5 className="modal-title fw-bold">
                      {popupType === "success" ? "✅ Success" : "❌ Error"}
                    </h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={() => {
                        setPopupMessage("");
                        setPopupType("");
                      }}
                    ></button>
                  </div>
                  <div className="modal-body text-center p-4">
                    <p className="fs-6 m-0">{popupMessage}</p>
                  </div>
                  <div className="modal-footer border-0 d-flex justify-content-center pb-4">
                    <button
                      type="button"
                      className={`btn px-4 ${
                        popupType === "success" ? "btn-success" : "btn-danger"
                      }`}
                      onClick={() => {
                        setPopupMessage("");
                        setPopupType("");
                      }}
                    >
                      OK
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;