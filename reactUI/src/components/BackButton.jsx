import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const BackButton = ({ style, className }) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(70); // default fallback

  useEffect(() => {
    // check screen size
    const checkScreen = () => setIsMobile(window.innerWidth < 768);
    checkScreen();
    window.addEventListener("resize", checkScreen);

    // measure header height
    const header = document.querySelector("header");
    if (header) setHeaderHeight(header.offsetHeight);

    // update on resize too
    const handleResize = () => {
      if (header) setHeaderHeight(header.offsetHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", checkScreen);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <span
      onClick={() => navigate(-1)}
      role="button"
      className={`d-inline-flex align-items-center justify-content-center rounded-circle border border-primary text-primary shadow-sm ${className || ""}`}
      style={{
        width: isMobile ? "30px" : "40px",
        height: isMobile ? "30px" : "40px",
        cursor: "pointer",
        position: "fixed",
        top: headerHeight + 10, // ✅ always just below header
        left: isMobile ? "10px" : "20px",
        zIndex: 1050,
        backgroundColor: "white",
        fontSize: isMobile ? "12px" : "14px",
        ...style,
      }}
    >
      <ArrowLeft size={isMobile ? 16 : 20} />
    </span>
  );
};

export default BackButton;
