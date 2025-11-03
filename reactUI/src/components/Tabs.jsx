// Tabs.jsx
import React, { useState, useEffect } from "react";
import { Truck, FileText, XCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Header from "./Header";
import API from "../services/api";

const Tabs = () => {
  const [activeTab, setActiveTab] = useState("tab1");
  const [role, setRole] = useState("user"); // default to "user"
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const tabs = [
    {
      id: "tab1",
      name: "Gate Entry",
      icon: <Truck size={20} />,
      color: "primary",
    },
    {
      id: "tab2",
      name: "Gate Entry Report",
      icon: <FileText size={20} />,
      color: "success",
    },
    {
      id: "tab3",
      name: "Cancellation",
      icon: <XCircle size={20} />,
      color: "danger",
    },
  ];

  // Fetch current user's role from backend using JWT cookie
  useEffect(() => {
    const fetchRole = async () => {
      try {
        const res = await API.post("/check-role", {});
        if (res.data.success) {
          setRole(res.data.role);
        } else {
          setRole("user"); // fallback
        }
      } catch (err) {
        console.error("Failed to fetch role:", err);
        setRole("user");
      } finally {
        setLoading(false);
      }
    };
    fetchRole();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <span>Loading...</span>
      </div>
    );
  }

  // ✅ Show cancellation tab for admin AND superadmin
  const visibleTabs =
    role === "admin" || role === "superadmin"
      ? tabs
      : tabs.filter((t) => t.id !== "tab3");

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (tabId === "tab1") navigate("/dashboard");
    else if (tabId === "tab2") navigate("/gate-entry-report");
    else if (tabId === "tab3") navigate("/cancel-tab");
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* ✅ Reusable Header */}
      <Header title="Industrial Gate Entry System" />

      {/* Main Content */}
      <main className="flex-grow-1 container d-flex flex-column justify-content-center text-center">
        <div className="mb-4">
          <h2 className="fw-bold mb-3">Industrial Gate Management</h2>
          <p className="text-muted small mx-auto w-75"></p>
        </div>

        {/* Buttons */}
        <div className="d-flex justify-content-center flex-wrap gap-3 mb-4">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`btn btn-${tab.color} d-flex align-items-center gap-2 px-4 py-3 rounded-3 shadow`}
              style={{ minWidth: "180px" }}
            >
              {tab.icon}
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <p className="text-muted small"></p>
      </main>
    </div>
  );
};

export default Tabs;
