import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../services/api"; // ✅ centralized axios instance

function ProtectedRoute({ children, allowedRoles }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await API.post(
          "/check-role",
          {},
          { withCredentials: true }
        );

        if (res.data.success) {
          const userRole = res.data.role;

          // ✅ If route has role restrictions, enforce them
          if (allowedRoles && !allowedRoles.includes(userRole)) {
            setAuthorized(false);
            navigate("/homepage", { replace: true }); // redirect to home/homepage
            return;
          }

          setAuthorized(true);
        } else {
          setAuthorized(false);
          navigate("/", { replace: true });
        }
      } catch (err) {
        if (err.response?.status === 401) {
          setAuthorized(false);
          navigate("/", { replace: true });
        } else {
          console.error(
            "Unexpected auth error:",
            err.response?.data || err.message
          );
          setAuthorized(false);
          navigate("/", { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [location, navigate, allowedRoles]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return authorized ? children : null;
}

export default ProtectedRoute;
