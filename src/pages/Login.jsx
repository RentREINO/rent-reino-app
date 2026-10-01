import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "owner@example.com",
    password: "Demo123!",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-brand">
          <div className="brand-mark light">R</div>
          <strong>RentREINO</strong>
        </div>
        <div className="auth-copy">
          <span>Rental management, simplified.</span>
          <h1>Your entire portfolio in one place.</h1>
          <p>
            Collect rent, manage leases, track maintenance, organize documents,
            and understand cash flow from any device.
          </p>
          <div className="auth-metrics">
            <div>
              <strong>24/7</strong>
              <span>Tenant portal</span>
            </div>
            <div>
              <strong>100%</strong>
              <span>Mobile ready</span>
            </div>
            <div>
              <strong>1</strong>
              <span>Unified ledger</span>
            </div>
          </div>
        </div>
      </div>
      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>
          <div className="auth-mobile-brand">
            <div className="brand-mark">R</div>
            <strong>RentREINO</strong>
          </div>
          <span className="eyebrow">Welcome back</span>
          <h2>Sign in to your account</h2>
          <p className="muted">
            Use your owner, manager, or tenant credentials.
          </p>
          {error && <div className="alert error">{error}</div>}
          <label className="field">
            <span>Email address</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          <button className="btn primary full" disabled={busy}>
            {busy ? "Signing in..." : "Sign in"}
          </button>
          {/* <div className="demo-note">
            <strong>Demo</strong>
            <span>Owner: owner@example.com / Demo123!</span>
            <span>Tenant: tenant@example.com / Demo123!</span>
          </div> */}
          <p className="auth-switch">
            New landlord? <Link to="/register">Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
