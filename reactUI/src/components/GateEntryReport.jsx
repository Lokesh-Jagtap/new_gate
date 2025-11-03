import React, { useState } from "react";
import { Play, AlertCircle } from "lucide-react";
import DatePicker from "react-datepicker";
import Header from "./Header";
import DataTable from "./DataTable";
import "react-datepicker/dist/react-datepicker.css";
import BackButton from "./BackButton";
import API from "../services/api"; // ✅ make sure you have this at the top


const SecondTab = () => {
  const [formData, setFormData] = useState({
    supplierFromCode: "",
    supplierToCode: "",
    dateFromDate: null,
    dateToDate: null,
    poNumberFrom: "",
    poNumberTo: "",
    supplierInvoiceFrom: "",
    supplierInvoiceTo: "",
    plant: "",
  });

  const [errors, setErrors] = useState({});
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gateEntrySearch, setGateEntrySearch] = useState("");
  const [sortOrder, setSortOrder] = useState(null);
  const [noData, setNoData] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // ✅ Added for backend error messages

  const columnMapping = {
    SysDate: "System Date",
    SysTime: "System Time",
    GateentryNo: "Gate Entry Number",
    LineNo: "Line Number",
    InvNo: "Invoice Number",
    VehicleNo: "Vehicle Number",
    VehIntime: "Vehicle In-Time",
    Cancel: "Cancelled?",
    CancReason: "Cancel Reason",
    Ebeln: "Purchase Order Number",
    Ebelp: "Purchase Order Item",
    Werks: "Plant",
    Lifnr: "Vendor Code",
    Name1: "Vendor Name",
    Matnr: "Material Code",
    Maktx: "Material Description",
    Menge: "Quantity",
  };

  const normalize = (d) =>
    d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : null;

  const todayNormalized = () => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  };

  const validateNumericField = (field, value, min, max) => {
    if (!value) return true;
    const regex = new RegExp(`^\\d{${min},${max}}$`);
    return regex.test(value);
  };

  const handleInputChange = (field, value) => {
    const next = { ...formData, [field]: value };
    const newErrors = { ...errors };

    if (field === "supplierFromCode" && !value) next.supplierToCode = "";
    if (field === "poNumberFrom" && !value) next.poNumberTo = "";
    if (field === "supplierInvoiceFrom" && !value) next.supplierInvoiceTo = "";
    if (field === "dateFromDate" && !value) next.dateToDate = null;

    if (
      [
        "supplierFromCode",
        "supplierToCode",
        "supplierInvoiceFrom",
        "supplierInvoiceTo",
        "poNumberFrom",
        "poNumberTo",
        "plant",
      ].includes(field)
    ) {
      next[field] = next[field].replace(/\D/g, "");
    }

    const fromN = normalize(next.dateFromDate);
    const toN = normalize(next.dateToDate);
    if (fromN && toN && fromN > toN) {
      newErrors.dateFromDate =
        "Date: 'From' date cannot be later than 'To' date";
    } else {
      delete newErrors.dateFromDate;
    }

    if (field === "plant") {
      newErrors[field] = !validateNumericField(field, next[field], 4, 4);
    } else if (
      field === "supplierInvoiceFrom" ||
      field === "supplierInvoiceTo"
    ) {
      newErrors[field] = !validateNumericField(field, next[field], 10, 10);
    } else if (field === "poNumberFrom" || field === "poNumberTo") {
      newErrors[field] = !validateNumericField(field, next[field], 10, 10);
    }

    setFormData(next);
    setErrors(newErrors);
  };

  const handleExecute = async () => {
    setNoData(false);
    setErrorMessage(""); // ✅ Reset error message

    const newErrors = {};
    const fromN = normalize(formData.dateFromDate);
    const toN = normalize(formData.dateToDate);

    if (!fromN) newErrors.dateFromDate = "Date From field is mandatory!";
    else if (fromN && toN && fromN > toN)
      newErrors.dateFromDate = "Date: 'From' date cannot be later than 'To' date";

    ["poNumberFrom", "poNumberTo"].forEach((field) => {
      if (!validateNumericField(field, formData[field], 10, 10))
        newErrors[field] = "Must be exactly 10 digits";
    });

    ["supplierInvoiceFrom", "supplierInvoiceTo"].forEach((field) => {
      if (!validateNumericField(field, formData[field], 10, 10))
        newErrors[field] = "Must be exactly 10 digits";
    });

    if (!validateNumericField("plant", formData.plant, 4, 4))
      newErrors.plant = "Must be exactly 4 digits";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    // ✅ Format dates properly (YYYY-MM-DD)
    const formattedData = {
      supplierFromCode: formData.supplierFromCode || "",
      supplierToCode: formData.supplierToCode || "",
      dateFromDate: formData.dateFromDate
        ? `${formData.dateFromDate.getFullYear()}-${String(
          formData.dateFromDate.getMonth() + 1
        ).padStart(2, "0")}-${String(
          formData.dateFromDate.getDate()
        ).padStart(2, "0")}`
        : "",
      dateToDate: formData.dateToDate
        ? `${formData.dateToDate.getFullYear()}-${String(
          formData.dateToDate.getMonth() + 1
        ).padStart(2, "0")}-${String(
          formData.dateToDate.getDate()
        ).padStart(2, "0")}`
        : "",
      poNumberFrom: formData.poNumberFrom || "",
      poNumberTo: formData.poNumberTo || "",
      supplierInvoiceFrom: formData.supplierInvoiceFrom || "",
      supplierInvoiceTo: formData.supplierInvoiceTo || "",
      plant: formData.plant || "",
    };

    try {
      // ✅ Axios POST request
      const { data } = await API.post("/sap-get-gateentry", formattedData);

      if (!data || data.length === 0) {
        setNoData(true);
        setApiData([]);
      } else {
        setApiData(data);
        setNoData(false);
      }
    } catch (error) {
      console.error("API Error:", error);

      // ✅ Handle 400 or 500 backend errors
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Network error. Please try again.";

      setErrorMessage(msg);
      setApiData([]);
      setNoData(true);
    } finally {
      setLoading(false);
    }
  };


  const removeLeadingZeros = (value) => {
    if (typeof value === "string") return value.replace(/^0+/, "") || "0";
    if (typeof value === "number") return String(value);
    return value;
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Header title="Gate Entry Report" />
      <BackButton />

      <main className="flex-grow-1 container mt-20 py-3">
        <div className="card shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
              <h2 className="h6 fw-semibold text-dark m-0">
                Gate Entry Report
              </h2>
              <button
                onClick={handleExecute}
                className="btn btn-primary d-flex align-items-center"
                disabled={loading}
              >
                <Play size={16} className="me-2" />
                {loading ? "Loading..." : "Execute"}
              </button>
            </div>

            {/* Form fields remain the same */}
            <div className="vstack gap-3">
              <div className="row g-2 align-items-center">
                <label className="col-sm-2 col-form-label fw-semibold">
                  Supplier Code
                </label>
                <div className="col-sm-10 d-flex align-items-center gap-2">
                  <div className="col-sm-3">
                    <input
                      type="text"
                      maxLength={10}
                      className="form-control"
                      value={formData.supplierFromCode}
                      onChange={(e) =>
                        handleInputChange("supplierFromCode", e.target.value)
                      }
                      placeholder="From"
                    />
                  </div>
                  <span className="text-muted">to</span>
                  <div className="col-sm-3">
                    <input
                      type="text"
                      maxLength={10}
                      className="form-control"
                      value={formData.supplierToCode}
                      onChange={(e) =>
                        handleInputChange("supplierToCode", e.target.value)
                      }
                      placeholder="To"
                      disabled={!formData.supplierFromCode}
                    />
                  </div>
                </div>
              </div>

              <div className="row g-2 align-items-center">
                <label className="col-sm-2 col-form-label fw-semibold">
                  Date <span className="text-danger">*</span>
                </label>
                <div className="col-sm-10 d-flex gap-2">
                  <DatePicker
                    selected={formData.dateFromDate}
                    onChange={(date) => handleInputChange("dateFromDate", date)}
                    placeholderText="From"
                    dateFormat="dd/MM/yyyy"
                    className={`form-control ${errors.dateFromDate ? "is-invalid" : ""
                      }`}
                    maxDate={new Date()}
                  />
                  <span className="text-muted">to</span>
                  <DatePicker
                    selected={formData.dateToDate}
                    onChange={(date) => handleInputChange("dateToDate", date)}
                    placeholderText="To"
                    dateFormat="dd/MM/yyyy"
                    className="form-control"
                    maxDate={new Date()}
                  />
                </div>
              </div>

              {errors.dateFromDate && (
                <div className="d-flex align-items-center text-danger ms-sm-2 mt-1">
                  <AlertCircle size={14} className="me-1" />
                  {errors.dateFromDate}
                </div>
              )}

              <div className="row g-2 align-items-center">
                <label className="col-sm-2 col-form-label fw-semibold">
                  PO Number
                </label>
                <div className="col-sm-10 d-flex align-items-center gap-2">
                  <div className="col-sm-3">
                    <input
                      type="text"
                      maxLength={10}
                      className={`form-control ${errors.poNumberFrom ? "is-invalid" : ""
                        }`}
                      value={formData.poNumberFrom}
                      onChange={(e) =>
                        handleInputChange("poNumberFrom", e.target.value)
                      }
                      placeholder="From"
                    />
                  </div>
                  <span className="text-muted">to</span>
                  <div className="col-sm-3">
                    <input
                      type="text"
                      maxLength={10}
                      className={`form-control ${errors.poNumberTo ? "is-invalid" : ""
                        }`}
                      value={formData.poNumberTo}
                      onChange={(e) =>
                        handleInputChange("poNumberTo", e.target.value)
                      }
                      placeholder="To"
                      disabled={!formData.poNumberFrom}
                    />
                  </div>
                </div>
              </div>

              <div className="row g-2 align-items-center">
                <label className="col-sm-2 col-form-label fw-semibold">
                  Supplier Invoice
                </label>
                <div className="col-sm-10 d-flex align-items-center gap-2">
                  <div className="col-sm-3">
                    <input
                      type="text"
                      maxLength={10}
                      className={`form-control ${errors.supplierInvoiceFrom ? "is-invalid" : ""
                        }`}
                      value={formData.supplierInvoiceFrom}
                      onChange={(e) =>
                        handleInputChange("supplierInvoiceFrom", e.target.value)
                      }
                      placeholder="From"
                    />
                  </div>
                  <span className="text-muted">to</span>
                  <div className="col-sm-3">
                    <input
                      type="text"
                      maxLength={10}
                      className={`form-control ${errors.supplierInvoiceTo ? "is-invalid" : ""
                        }`}
                      value={formData.supplierInvoiceTo}
                      onChange={(e) =>
                        handleInputChange("supplierInvoiceTo", e.target.value)
                      }
                      placeholder="To"
                      disabled={!formData.supplierInvoiceFrom}
                    />
                  </div>
                </div>
              </div>

              <div className="row g-2 align-items-center">
                <label className="col-sm-2 col-form-label fw-semibold">
                  Plant
                </label>
                <div className="col-sm-2">
                  <input
                    type="text"
                    maxLength={4}
                    className={`form-control ${errors.plant ? "is-invalid" : ""
                      }`}
                    value={formData.plant}
                    onChange={(e) => handleInputChange("plant", e.target.value)}
                    placeholder="Plant"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-center mt-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}

        {/* ✅ Show backend error message */}
        {!loading && errorMessage && (
          <div className="alert alert-danger mt-4 d-flex align-items-center">
            <AlertCircle size={18} className="me-2" />
            {errorMessage}
          </div>
        )}

        {!loading && noData && !errorMessage && (
          <div className="text-center text-danger fw-bold fs-5 mt-4">
            No data found
          </div>
        )}

        {!loading && apiData.length > 0 && (
          <DataTable data={apiData} columnMapping={columnMapping} />
        )}
      </main>
    </div>
  );
};

export default SecondTab;
