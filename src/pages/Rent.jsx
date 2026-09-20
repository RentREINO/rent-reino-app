import { useEffect, useMemo, useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { api, money, shortDate } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

import {
  Badge,
  Empty,
  Field,
  Icon,
  Modal,
  PageHeader,
  Spinner,
  Toast,
} from "../components/UI.jsx";

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

export default function Rent() {
  const { user } = useAuth();
  const [charges, setCharges] = useState(null),
    [payments, setPayments] = useState([]),
    [leases, setLeases] = useState([]),
    [payOpen, setPayOpen] = useState(false),
    [manualOpen, setManualOpen] = useState(false),
    [clientSecret, setClientSecret] = useState(""),
    [amount, setAmount] = useState(""),
    [leaseId, setLeaseId] = useState(""),
    [toast, setToast] = useState("");
  const load = async () => {
    const [a, b, c] = await Promise.all([
      api("/charges"),
      api("/payments"),
      api("/leases"),
    ]);
    setCharges(a);
    setPayments(b);
    setLeases(c);
    if (user.role === "tenant" && c[0]) setLeaseId(c[0]._id);
  };
  useEffect(() => {
    load();
  }, []);
  const openBalance = useMemo(
    () =>
      charges
        ?.filter((c) => ["open", "partial"].includes(c.status))
        .reduce((s, c) => s + c.balance, 0) || 0,
    [charges],
  );
  const beginPay = async () => {
    const numeric = Number(amount || openBalance);
    if (!numeric || !leaseId)
      return setToast("Enter an amount and select a lease");
    try {
      const r = await api("/payments/create-intent", {
        method: "POST",
        body: JSON.stringify({ leaseId, amount: numeric }),
      });
      setClientSecret(r.clientSecret);
      setPayOpen(true);
    } catch (e) {
      setToast(e.message);
    }
  };
  const manual = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await api("/payments/manual", {
      method: "POST",
      body: JSON.stringify({
        leaseId: fd.get("leaseId"),
        amount: Number(fd.get("amount")),
        method: fd.get("method"),
        reference: fd.get("reference"),
        receivedAt: fd.get("receivedAt") || new Date(),
      }),
    });
    setManualOpen(false);
    setToast("Payment recorded");
    load();
  };
  if (!charges) return <Spinner />;
  return (
    <>
      <PageHeader
        eyebrow="Ledger"
        title={user.role === "tenant" ? "Rent & payments" : "Rent ledger"}
        description={
          user.role === "tenant"
            ? "Pay securely and review your payment history."
            : "Track every charge, payment, balance, and payment method."
        }
        action={
          user.role === "tenant" ? (
            <button
              className="btn primary"
              onClick={() => {
                setAmount(openBalance.toFixed(2));
                beginPay();
              }}
              disabled={!openBalance}
            >
              <Icon name="dollar" />
              Pay balance
            </button>
          ) : (
            <button className="btn primary" onClick={() => setManualOpen(true)}>
              <Icon name="plus" />
              Record payment
            </button>
          )
        }
      />
      <div className="rent-summary">
        <div className="balance-card">
          <span>Outstanding balance</span>
          <strong>{money(openBalance)}</strong>
          <p>
            {charges.filter((c) => c.status === "partial").length} partially
            paid · {charges.filter((c) => c.status === "open").length} open
          </p>
        </div>
        {user.role === "tenant" && (
          <div className="quick-pay">
            <div>
              <span className="eyebrow">Make a payment</span>
              <h2>Pay any amount</h2>
            </div>
            <div className="pay-controls">
              <div className="amount-input">
                <span>$</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={openBalance.toFixed(2)}
                />
              </div>
              <button className="btn primary" onClick={beginPay}>
                Continue
              </button>
            </div>
            <small>
              Payment methods shown are controlled by your Stripe account
              configuration.
            </small>
          </div>
        )}
      </div>
      <section className="panel table-panel">
        <div className="panel-head">
          <div>
            <span className="eyebrow">Charges</span>
            <h2>Rent & fees</h2>
          </div>
        </div>
        {charges.length ? (
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  {user.role !== "tenant" && <th>Tenant</th>}
                  <th>Due date</th>
                  <th>Original</th>
                  <th>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {charges.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <strong>{c.description}</strong>
                      <span className="table-sub">
                        {c.leaseId?.propertyId?.name} ·{" "}
                        {c.unitId?.label || c.leaseId?.unitId?.label}
                      </span>
                    </td>
                    {user.role !== "tenant" && <td>{c.tenantId?.name}</td>}
                    <td>{shortDate(c.dueDate)}</td>
                    <td>{money(c.amount)}</td>
                    <td>
                      <strong>{money(c.balance)}</strong>
                    </td>
                    <td>
                      <Badge
                        tone={
                          c.status === "paid"
                            ? "success"
                            : c.status === "partial"
                              ? "warning"
                              : new Date(c.dueDate) < new Date()
                                ? "danger"
                                : "neutral"
                        }
                      >
                        {c.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No charges"
            text="Charges are created when an active lease is initialized."
          />
        )}
      </section>
      <section className="panel table-panel">
        <div className="panel-head">
          <div>
            <span className="eyebrow">History</span>
            <h2>Payments</h2>
          </div>
        </div>
        {payments.length ? (
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  {user.role !== "tenant" && <th>Tenant</th>}
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id}>
                    <td>{shortDate(p.receivedAt || p.createdAt)}</td>
                    {user.role !== "tenant" && <td>{p.tenantId?.name}</td>}
                    <td className="capitalize">
                      {p.method.replaceAll("_", " ")}
                    </td>
                    <td>
                      {p.reference ||
                        p.stripePaymentIntentId?.slice(-10) ||
                        "—"}
                    </td>
                    <td>
                      <strong>{money(p.amount)}</strong>
                    </td>
                    <td>
                      <Badge
                        tone={
                          p.status === "succeeded"
                            ? "success"
                            : p.status === "failed"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {p.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No payments yet"
            text="Successful and manually recorded payments appear here."
          />
        )}
      </section>
      <Modal
        open={payOpen}
        onClose={() => {
          setPayOpen(false);
          setClientSecret("");
        }}
        title="Secure rent payment"
      >
        {clientSecret && stripePromise ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: { borderRadius: "10px" },
              },
            }}
          >
            <Checkout
              amount={Number(amount || openBalance)}
              onDone={() => {
                setPayOpen(false);
                setClientSecret("");
                setToast(
                  "Payment submitted. Your ledger updates after Stripe confirms it.",
                );
                setTimeout(load, 1500);
              }}
            />
          </Elements>
        ) : (
          <div className="alert warning">
            Stripe publishable key is not configured in the client.
          </div>
        )}
      </Modal>
      <Modal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        title="Record offline payment"
      >
        <form className="form-grid" onSubmit={manual}>
          <Field label="Lease">
            <select name="leaseId" required>
              <option value="">Select lease</option>
              {leases
                .filter((l) => l.status === "active")
                .map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.tenantId?.name} · {l.propertyId?.name} /{" "}
                    {l.unitId?.label}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Amount">
            <input
              name="amount"
              required
              type="number"
              min="0.01"
              step="0.01"
            />
          </Field>
          <Field label="Method">
            <select name="method">
              <option value="cash">Cash</option>
              <option value="check">Check</option>
              <option value="ach">ACH / bank transfer</option>
              <option value="money_order">Money order</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Reference">
            <input name="reference" placeholder="Check # or confirmation" />
          </Field>
          <Field label="Received date">
            <input
              name="receivedAt"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
          </Field>
          <div className="form-actions">
            <button
              type="button"
              className="btn ghost"
              onClick={() => setManualOpen(false)}
            >
              Cancel
            </button>
            <button className="btn primary">Record payment</button>
          </div>
        </form>
      </Modal>
      <Toast
        message={toast}
        type={toast.includes("configured") ? "error" : "success"}
        onClose={() => setToast("")}
      />
    </>
  );
}

function Checkout({ amount, onDone }) {
  const stripe = useStripe(),
    elements = useElements();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setError("");
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });
    if (error) setError(error.message);
    else if (
      paymentIntent?.status === "succeeded" ||
      paymentIntent?.status === "processing"
    )
      onDone();
    setBusy(false);
  };
  return (
    <form onSubmit={submit} className="stripe-form">
      <div className="payment-amount">
        <span>Payment amount</span>
        <strong>{money(amount)}</strong>
      </div>
      <PaymentElement />
      <button className="btn primary full" disabled={busy || !stripe}>
        {busy ? "Processing..." : `Pay ${money(amount)}`}
      </button>
      {error && <div className="alert error">{error}</div>}
      <p className="secure-note">
        Payment details are entered directly into Stripe’s secure payment
        element.
      </p>
    </form>
  );
}
