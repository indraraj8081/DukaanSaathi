import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ContactLinks from "./ContactLinks";

const nav = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  { to: "/features", label: "Features" },
  { to: "/contact", label: "Contact" },
];

const PublicLayout = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const item = ({ isActive }) =>
    `px-2 py-1 font-medium whitespace-nowrap ${
      isActive ? "text-green-700" : "text-gray-700 hover:text-green-700"
    }`;
  const iconLink =
    "flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-green-700 whitespace-nowrap";
  const btn =
    "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-white whitespace-nowrap";

  return (
    <div className="min-h-dvh bg-green-50/50 flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <img src="/favicon.svg" alt="" width="44" height="44" />
            <span className="min-w-0">
              <span className="block text-xl font-extrabold leading-tight truncate">
                <span className="text-gray-900">Dukan </span>
                <span className="text-green-700">Saathi</span>
              </span>
              <span className="block text-xs text-gray-500 truncate">Apni Dukan, Hamara Saath</span>
            </span>
          </Link>

          {/* Page links (desktop) */}
          <nav className="hidden lg:flex items-center gap-5">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={item}>
                {n.label}
              </NavLink>
            ))}
          </nav>

          {/* Right side (desktop) */}
          <div className="hidden lg:flex items-center gap-3">
            {!user && (
              <>
                <Link to="/login" className={`${btn} bg-green-700 hover:bg-green-800`}>👤 Customer</Link>
                <Link to="/admin-login" className={`${btn} bg-blue-900 hover:bg-blue-950`}>🛡️ Admin Panel</Link>
                <Link to="/register" className={`${btn} bg-orange-500 hover:bg-orange-600`}>🏪 Register Your Shop</Link>
              </>
            )}
            {user?.role === "customer" && (
              <>
                <Link to="/my-orders" className={iconLink}>📋 My Orders</Link>
                <Link to="/account" className={iconLink}>👤 Account</Link>
                <button onClick={logout} className={iconLink}>🚪 Logout</button>
              </>
            )}
            {user?.role === "shopkeeper" && (
              <Link to="/dashboard" className={`${btn} bg-green-700`}>My Dashboard</Link>
            )}
            {user?.role === "admin" && (
              <Link to="/admin" className={`${btn} bg-blue-900`}>Admin Panel</Link>
            )}
          </div>

          {/* Hamburger (phone and tablet) */}
          <button
            className="lg:hidden w-10 h-10 text-2xl rounded hover:bg-gray-100 shrink-0"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>

        {open && (
          <div className="lg:hidden border-t px-4 py-3 space-y-2" onClick={() => setOpen(false)}>
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg font-medium ${
                    isActive ? "bg-green-50 text-green-700" : "text-gray-700"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
            {!user && (
              <>
                <Link to="/login" className={`${btn} bg-green-700 w-full`}>👤 Customer</Link>
                <Link to="/shop-login" className={`${btn} bg-green-900 w-full`}>🏪 Shop Owner Login</Link>
                <Link to="/register" className={`${btn} bg-orange-500 w-full`}>Register Your Shop</Link>
                <Link to="/admin-login" className={`${btn} bg-blue-900 w-full`}>🛡️ Admin Panel</Link>
              </>
            )}
            {user?.role === "customer" && (
              <>
                <Link to="/my-orders" className="block px-3 py-2 font-medium">📋 My Orders</Link>
                <Link to="/account" className="block px-3 py-2 font-medium">👤 Account</Link>
                <button onClick={logout} className="block px-3 py-2 font-medium text-red-600">🚪 Logout</button>
              </>
            )}
            {user?.role === "shopkeeper" && (
              <Link to="/dashboard" className={`${btn} bg-green-700 w-full`}>My Dashboard</Link>
            )}
            {user?.role === "admin" && (
              <Link to="/admin" className={`${btn} bg-blue-900 w-full`}>Admin Panel</Link>
            )}
          </div>
        )}
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-6 pb-28">
        <Outlet />
      </main>

      <footer className="bg-green-950 text-green-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 grid sm:grid-cols-3 gap-6 text-sm">
          <div>
            <p className="text-white font-bold text-lg">Dukan Saathi</p>
            <p className="mt-1 text-green-200">Apni Dukan, Hamara Saath.</p>
          </div>
          <div className="space-y-1">
            <p className="text-white font-semibold">Quick links</p>
            {nav.map((n) => (
              <Link key={n.to} to={n.to} className="block hover:underline">{n.label}</Link>
            ))}
            <Link to="/shop-login" className="block hover:underline">Shop owner login</Link>
          </div>
          <ContactLinks className="[&_*]:!text-green-100" />
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;