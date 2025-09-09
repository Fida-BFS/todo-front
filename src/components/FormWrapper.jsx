// src/components/FormWrapper.jsx
import React, { useEffect } from "react";

const FormWrapper = ({ title, show, onClose, children, maxWidth = "600px" }) => {
  if (!show) return null;

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        className="position-fixed top-0 start-0 w-100 h-100"
        style={{ background: "rgba(0,0,0,0.5)", zIndex: 1040 }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
        style={{ zIndex: 1050 }}
        aria-modal="true"
        role="dialog"
      >
        <div
          className="bg-white rounded shadow"
          style={{ width: "92%", maxWidth }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="d-flex align-items-center justify-content-between border-bottom p-3">
            <h5 className="mb-0">{title}</h5>
            <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
              <i className="bi bi-x-lg" />
            </button>
          </div>
          <div className="p-3">{children}</div>
        </div>
      </div>
    </>
  );
};

export default FormWrapper;
