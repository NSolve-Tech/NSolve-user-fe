import { useState } from "react";
import "./password-input.css";

export default function PasswordInput({ className, style, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="password-input">
      <input
        {...props}
        className={className}
        type={visible ? "text" : "password"}
        style={{ ...style, paddingRight: "40px" }}
      />
      <button
        className="password-input-toggle"
        type="button"
        aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
          {visible && <path d="m4 4 16 16" />}
        </svg>
      </button>
    </span>
  );
}
