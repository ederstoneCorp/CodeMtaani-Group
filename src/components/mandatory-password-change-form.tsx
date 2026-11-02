"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Eye, EyeOff, Lock, ShieldCheck, X } from "lucide-react";

interface MandatoryPasswordChangeFormProps {
  fullName: string;
  email: string;
  staffNumber: string | null;
  role: string;
}

export function MandatoryPasswordChangeForm({
  fullName,
  email,
  staffNumber,
  role,
}: MandatoryPasswordChangeFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Validation criteria
  const hasMinLength = newPassword.length >= 12;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isDifferent = Boolean(newPassword && currentPassword && newPassword !== currentPassword);
  const isMatching = Boolean(newPassword && confirmPassword && newPassword === confirmPassword);

  const criteriaCount = [
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
    isDifferent,
    isMatching,
  ].filter(Boolean).length;

  // Strength score
  let strengthLabel = "Weak";
  let strengthColor = "#ef4444";
  let strengthWidth = "20%";

  if (criteriaCount >= 7) {
    strengthLabel = "Excellent";
    strengthColor = "#10b981";
    strengthWidth = "100%";
  } else if (criteriaCount >= 5) {
    strengthLabel = "Strong";
    strengthColor = "#45c8d8";
    strengthWidth = "75%";
  } else if (criteriaCount >= 3) {
    strengthLabel = "Moderate";
    strengthColor = "#f59e0b";
    strengthWidth = "50%";
  }

  const isValid =
    hasMinLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSpecial &&
    isDifferent &&
    isMatching;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/admin/password/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password.");
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = data.redirect || "/admin";
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Password update failed.");
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#031518",
        backgroundImage: "radial-gradient(circle at 50% 10%, rgba(69,200,216,0.12), transparent 60%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "var(--font-sans, sans-serif)",
        color: "#e8f4f6",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          backgroundColor: "#072329",
          border: "1px solid rgba(69, 200, 216, 0.3)",
          borderRadius: "14px",
          padding: "36px 32px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
        }}
      >
        {/* Brand Lockup */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <Image
            src="/Codemtaani_Group_logo__2_-removebg-preview.png"
            alt="CodeMtaani Group logo"
            width={44}
            height={44}
            priority
          />
          <div>
            <div style={{ fontSize: "14px", fontWeight: 800, letterSpacing: "0.08em", color: "#fff" }}>
              CODEMTAANI<span style={{ color: "#45c8d8" }}>.</span>GROUP
            </div>
            <div style={{ fontSize: "11px", color: "#63d8e5", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Identity &amp; Access Governance
            </div>
          </div>
        </div>

        {/* Staff Profile Lockup */}
        <div
          style={{
            backgroundColor: "rgba(3, 21, 24, 0.7)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            padding: "12px 14px",
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>{fullName}</div>
            <div style={{ fontSize: "11px", color: "#8fa3a6" }}>
              {email} · {role.replaceAll("_", " ")}
            </div>
          </div>
          {staffNumber && (
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "11px",
                fontWeight: 700,
                color: "#45c8d8",
                backgroundColor: "rgba(69,200,216,0.15)",
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px solid rgba(69,200,216,0.3)",
              }}
            >
              {staffNumber}
            </span>
          )}
        </div>

        {/* Headline & Policy Notice */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "22px", margin: "0 0 8px", color: "#fff", lineHeight: "1.3" }}>
            Welcome to CodeMtaani Group
          </h1>
          <p style={{ fontSize: "13px", lineHeight: "1.6", color: "#b9ced2", margin: 0 }}>
            Your account has been created by the organisation’s administration. For security purposes, you are
            required to change your temporary password before accessing your staff dashboard.
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "8px",
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              color: "#fca5a5",
              fontSize: "12px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <X size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div
            style={{
              textAlign: "center",
              padding: "32px 16px",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "8px",
            }}
          >
            <ShieldCheck size={48} style={{ color: "#10b981", margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: "18px", color: "#fff", margin: "0 0 8px" }}>Password Successfully Changed</h3>
            <p style={{ fontSize: "13px", color: "#a8c7cd", margin: 0 }}>
              Your credentials are confirmed. Redirecting to your staff dashboard…
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Current Temporary Password */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "#c2d8dc", marginBottom: "6px" }}>
                Current Temporary Password *
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showCurrent ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter administrator-assigned temporary password"
                  style={{
                    width: "100%",
                    padding: "10px 42px 10px 12px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    backgroundColor: "rgba(4, 25, 30, 0.8)",
                    color: "#fff",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#8fa3a6",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                  aria-label="Toggle password visibility"
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "#c2d8dc", marginBottom: "6px" }}>
                New Password *
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showNew ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Choose a strong permanent password"
                  style={{
                    width: "100%",
                    padding: "10px 42px 10px 12px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    backgroundColor: "rgba(4, 25, 30, 0.8)",
                    color: "#fff",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#8fa3a6",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                  aria-label="Toggle password visibility"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Strength Meter */}
              {newPassword && (
                <div style={{ marginTop: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                    <span style={{ color: "#8fa3a6" }}>Password Strength:</span>
                    <span style={{ color: strengthColor, fontWeight: 700 }}>{strengthLabel}</span>
                  </div>
                  <div style={{ height: "4px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: strengthWidth,
                        backgroundColor: strengthColor,
                        transition: "all 0.3s ease",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "#c2d8dc", marginBottom: "6px" }}>
                Confirm New Password *
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  style={{
                    width: "100%",
                    padding: "10px 42px 10px 12px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    backgroundColor: "rgba(4, 25, 30, 0.8)",
                    color: "#fff",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#8fa3a6",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                  aria-label="Toggle password visibility"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Live Requirements Checklist */}
            <div
              style={{
                backgroundColor: "rgba(4, 25, 30, 0.5)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
                padding: "14px",
                marginBottom: "24px",
              }}
            >
              <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#63d8e5", marginBottom: "8px" }}>
                Password Requirements
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                <li style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "6px", color: hasMinLength ? "#10b981" : "#8fa3a6" }}>
                  {hasMinLength ? <Check size={13} /> : <span style={{ width: 13, textAlign: "center" }}>•</span>}
                  Min 12 characters
                </li>
                <li style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "6px", color: hasUppercase ? "#10b981" : "#8fa3a6" }}>
                  {hasUppercase ? <Check size={13} /> : <span style={{ width: 13, textAlign: "center" }}>•</span>}
                  Uppercase letter
                </li>
                <li style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "6px", color: hasLowercase ? "#10b981" : "#8fa3a6" }}>
                  {hasLowercase ? <Check size={13} /> : <span style={{ width: 13, textAlign: "center" }}>•</span>}
                  Lowercase letter
                </li>
                <li style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "6px", color: hasNumber ? "#10b981" : "#8fa3a6" }}>
                  {hasNumber ? <Check size={13} /> : <span style={{ width: 13, textAlign: "center" }}>•</span>}
                  At least one number
                </li>
                <li style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "6px", color: hasSpecial ? "#10b981" : "#8fa3a6" }}>
                  {hasSpecial ? <Check size={13} /> : <span style={{ width: 13, textAlign: "center" }}>•</span>}
                  Special symbol
                </li>
                <li style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "6px", color: isDifferent ? "#10b981" : "#8fa3a6" }}>
                  {isDifferent ? <Check size={13} /> : <span style={{ width: 13, textAlign: "center" }}>•</span>}
                  Differs from temporary
                </li>
                <li style={{ fontSize: "11px", gridColumn: "span 2", display: "flex", alignItems: "center", gap: "6px", color: isMatching ? "#10b981" : "#8fa3a6" }}>
                  {isMatching ? <Check size={13} /> : <span style={{ width: 13, textAlign: "center" }}>•</span>}
                  Passwords match
                </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={busy || !isValid}
              className="button-primary"
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "13px",
                cursor: busy || !isValid ? "not-allowed" : "pointer",
                opacity: busy || !isValid ? 0.6 : 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <Lock size={15} />
              {busy ? "Securing Account…" : "Update Password & Access Dashboard ↗"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
