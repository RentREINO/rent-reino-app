import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Icon } from "./UI.jsx";

const ownerNav = [
  ["/", "dashboard", "Dashboard"],
  ["/properties", "home", "Properties"],
  ["/tenants", "users", "Tenants"],
  ["/leases", "file", "Leases"],
  ["/rent", "dollar", "Rent & payments"],
  ["/maintenance", "wrench", "Maintenance"],
  ["/expenses", "receipt", "Expenses"],
  ["/documents", "file", "Documents"],
  ["/reports", "chart", "Reports"],
  ["/settings", "settings", "Settings"],
];
const tenantNav = [
  ["/", "dashboard", "Home"],
  ["/lease", "file", "My lease"],
  ["/rent", "dollar", "Pay rent"],
  ["/maintenance", "wrench", "Maintenance"],
  ["/documents", "file", "Documents"],
  ["/settings", "settings", "Account"],
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notices, setNotices] = useState([]);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const nav = user?.role === "tenant" ? tenantNav : ownerNav;

  const loadNotices = async () => {
    try {
      setNotices(await api("/notifications"));
    } catch {}
  };
  useEffect(() => {
    loadNotices();
  }, []);
  const unread = notices.filter((n) => !n.read).length;

  const doLogout = () => {
    logout();
    navigate("/login");
  };
  const markAll = async () => {
    await api("/notifications/read-all", { method: "PATCH" });
    setNotices((v) => v.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">R</div>
          <div>
            <strong>RentREINO</strong>
            <span>Property Management</span>
          </div>
        </div>
        <nav>
          {nav.map(([to, icon, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={() => setMenuOpen(false)}
            >
              <Icon name={icon} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="avatar">{user?.name?.slice(0, 1)?.toUpperCase()}</div>
          <div>
            <strong>{user?.name}</strong>
            <span>{user?.role}</span>
          </div>
          <button onClick={doLogout} title="Sign out">
            <Icon name="logout" size={18} />
          </button>
        </div>
      </aside>
      {menuOpen && (
        <button
          className="sidebar-overlay"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        />
      )}
      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMenuOpen(true)}>
            <Icon name="menu" />
          </button>
          <div className="topbar-spacer" />
          <div className="notification-wrap">
            <button
              className="icon-btn notification-btn"
              onClick={() => setNoticeOpen((v) => !v)}
            >
              <Icon name="bell" />
              {unread > 0 && <i>{unread > 9 ? "9+" : unread}</i>}
            </button>
            {noticeOpen && (
              <div className="notification-panel">
                <div className="notification-head">
                  <strong>Notifications</strong>
                  {unread > 0 && (
                    <button onClick={markAll}>Mark all read</button>
                  )}
                </div>
                {notices.length ? (
                  notices.slice(0, 8).map((n) => (
                    <button
                      key={n._id}
                      className={`notification-item ${n.read ? "" : "unread"}`}
                      onClick={async () => {
                        if (!n.read) {
                          await api(`/notifications/${n._id}/read`, {
                            method: "PATCH",
                          });
                          setNotices((v) =>
                            v.map((x) =>
                              x._id === n._id ? { ...x, read: true } : x,
                            ),
                          );
                        }
                        setNoticeOpen(false);
                        if (n.link) navigate(n.link);
                      }}
                    >
                      <strong>{n.title}</strong>
                      <span>{n.message}</span>
                    </button>
                  ))
                ) : (
                  <div className="notification-empty">No notifications</div>
                )}
              </div>
            )}
          </div>
          <div className="top-user">
            <div className="avatar small">
              {user?.name?.slice(0, 1)?.toUpperCase()}
            </div>
            <span>{user?.name}</span>
          </div>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </main>
      <nav className="mobile-bottom-nav">
        {nav.slice(0, 5).map(([to, icon, label]) => (
          <NavLink key={to} to={to} end={to === "/"}>
            <Icon name={icon} size={20} />
            <span>{label.split(" ")[0]}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
