import React from "react";
import dashboardLogo from "./icon.png";
import applicationWordmark from "./Overlay.png";

function Brand({ variant = "sidebar" }) {
  const dashboard = variant === "sidebar" || variant === "dashboard-compact";
  const dashboardCompact = variant === "dashboard-compact";

  return (
    <div className={`brand brand-${variant}`}>
      {dashboard ? (
        <>
          <img className="brand-logo" src={dashboardLogo} alt="Logo NSolve-Tech" />
          <span className="brand-copy">
            <strong className="brand-title">NSolve-Tech</strong>
            {!dashboardCompact && <span className="brand-caption">PORTAL SISWA</span>}
          </span>
        </>
      ) : (
        <>
          <span className="brand-overlay-mark" aria-hidden="true">
            <img src={applicationWordmark} alt="" />
          </span>
          <span className="brand-copy">
            <strong className="brand-title">NSolve-Tech</strong>
            {variant === "top" && <span className="brand-caption">PORTAL SISWA</span>}
          </span>
        </>
      )}
    </div>
  );
}

export default Brand;
