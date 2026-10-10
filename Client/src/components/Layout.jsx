import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ContactLinks from "./ContactLinks";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/billing", label: "Billing", icon: "🧾" },
  { to: "/bills", label: "Bills", icon: "📄" },
  { to: "/products", label: "Products", icon: "📦" },
  { to: "/customers", label: "Customers", icon: "👥" },
  { to: "/purchases", label: "Purchases", icon: "🚚" },
  { to: "/reports", label: "Reports", icon: "📈" },
];

const Layout = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  // While the mobile menu is open: close on Escape and lock page scroll
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
      isActive ? "bg-green-600 text-white" : "text-gray-700 hover:bg-green-100"
    }`;

  return (
    <div className="min-h-dvh bg-green-50 md:flex">
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        id="sidebar"
        className={`fixed md:sticky md:top-0 md:h-dvh z-30 inset-y-0 left-0 w-64 max-w-[85vw] bg-white shadow p-4 flex flex-col overflow-y-auto transition-transform ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between mb-6 px-2">
          <h1 className="text-xl font-bold text-green-700">Dukan Saathi 🛒</h1>
          <button
            className="md:hidden w-10 h-10 text-xl rounded hover:bg-gray-100"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass} onClick={() => setOpen(false)}>
              <span>{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <ContactLinks className="px-2 py-3 border-t mt-3" />

        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 font-medium"
        >
          🚪 Logout
        </button>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="bg-white shadow-sm px-4 py-2 flex items-center justify-between gap-3 sticky top-0 z-10">
          <div className="flex items-center gap-2 min-w-0">
            <button
              className="md:hidden w-10 h-10 text-2xl rounded hover:bg-gray-100"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="sidebar"
            >
              ☰
            </button>
            <span className="font-semibold text-gray-800 truncate">{user.shopName}</span>
          </div>
          <span className="text-sm text-gray-600 whitespace-nowrap hidden sm:inline">
            👤 {user.name}
          </span>
        </header>

        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;