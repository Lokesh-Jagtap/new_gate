import React, { useState } from "react";
import { Play, AlertCircle } from "lucide-react";
import Header from "./Header";
import PopupModal from "./PopupModal";
import BackButton from "./BackButton";
import API from "../services/api"; // ✅ make sure you have this at the top

const Cancel = () => {
  const [formData, setFormData] = useState({
    gateEntryNo: "",
    reason: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);

  // 🔹 Popup state
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("");

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.gateEntryNo) {
      newErrors.gateEntryNo = "Gate Entry No. is required!";
    } else if (!/^\d{10}$/.test(formData.gateEntryNo)) {
      newErrors.gateEntryNo = "Gate Entry No. must be exactly 10 digits!";
    }

    if (!formData.reason) {
      newErrors.reason = "Reason is required!";
    }

    return newErrors;
  };

  const handleExecute = async () => {
    const newErrors = validate();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      // 🔹 POST request using Axios (cookies auto included)
      const { data } = await API.post("/sap-cancel", {
        GateentryNo: formData.gateEntryNo,
        CancReason: formData.reason,
      });

      if (!data.success) {
        throw new Error(data.error || "Cancellation failed");
      }

      // ✅ Success popup
      setPopupMessage(data.message || "Gate entry cancelled successfully!");
      setPopupType("success");

      // Reset form
      setFormData({ gateEntryNo: "", reason: "" });
      setTouched({});
    } catch (err) {
      console.error("Cancel Error:", err);

      // ✅ Try to get SAP message from backend's response
      const msg =
        err.response?.data?.error || // backend sends "error"
        err.response?.data?.message || // fallback
        err.message ||
        "Cancellation failed";

      setPopupMessage(msg);
      setPopupType("error");
    } finally {
      setLoading(false);
    }
  };

  const getValidationClass = (field) => {
    if (!touched[field]) return "";
    return errors[field] ? "is-invalid" : "border-success border-2";
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Header title="Gate Entry Cancellation" />
      <BackButton />

      <main className="flex-grow-1 container pt-5 mt-4">
        <div className="card shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
              <h2 className="h6 fw-semibold text-dark m-0">
                Cancel Gate Entry
              </h2>
              <button
                onClick={handleExecute}
                className="btn btn-primary d-flex align-items-center"
                disabled={loading}
              >
                <Play size={16} className="me-2" />
                {loading ? "Processing..." : "Execute"}
              </button>
            </div>

            <div className="vstack gap-3">
              {/* Gate Entry No */}
              <div className="row g-2 align-items-center">
                <label className="col-sm-2 col-form-label fw-semibold">
                  Gate Entry No. <span className="text-danger">*</span>
                </label>
                <div className="col-sm-10">
                  <input
                    type="text"
                    className={`form-control ${getValidationClass(
                      "gateEntryNo"
                    )}`}
                    value={formData.gateEntryNo}
                    onChange={(e) =>
                      handleInputChange("gateEntryNo", e.target.value)
                    }
                    placeholder="Enter Gate Entry No."
                    maxLength={10}
                  />
                  {errors.gateEntryNo && (
                    <div className="d-flex align-items-center text-danger mt-1">
                      <AlertCircle size={14} className="me-1" />
                      {errors.gateEntryNo}
                    </div>
                  )}
                </div>
              </div>

              {/* Reason */}
              <div className="row g-2 align-items-center">
                <label className="col-sm-2 col-form-label fw-semibold">
                  Reason <span className="text-danger">*</span>
                </label>
                <div className="col-sm-10">
                  <textarea
                    className={`form-control ${getValidationClass("reason")}`}
                    value={formData.reason}
                    onChange={(e) =>
                      handleInputChange("reason", e.target.value)
                    }
                    placeholder="Enter reason for cancellation"
                  />
                  {errors.reason && (
                    <div className="d-flex align-items-center text-danger mt-1">
                      <AlertCircle size={14} className="me-1" />
                      {errors.reason}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 🔹 Popup Modal */}
      <PopupModal
        show={!!popupMessage}
        type={popupType}
        message={popupMessage}
        onClose={() => {
          setPopupMessage("");
          setPopupType("");
        }}
      />
    </div>
  );
};

export default Cancel;
