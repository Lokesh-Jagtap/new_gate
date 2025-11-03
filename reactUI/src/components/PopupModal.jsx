import React from "react";

const PopupModal = ({ show, type, message, onClose }) => {
  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        style={{
          backdropFilter: "blur(4px)",
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
      ></div>

      {/* Modal */}
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg rounded-3">
            <div
              className={`modal-header ${
                type === "success" ? "bg-success" : "bg-danger"
              } text-white rounded-top-3`}
            >
              <h5 className="modal-title fw-bold">
                {type === "success" ? "✅ Success" : "❌ Error"}
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
              ></button>
            </div>

            <div className="modal-body text-center p-4">
              <p className="fs-6 m-0">{message}</p>
            </div>

            <div className="modal-footer border-0 d-flex justify-content-center pb-4">
              <button
              id='popup-close'
                type="button"
                className={`btn px-4 ${
                  type === "success" ? "btn-success" : "btn-danger"
                }`}
                onClick={onClose}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PopupModal;
