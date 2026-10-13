import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import Logo from "./Logo";
import ContactLinks from "./ContactLinks";

const nav = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  { to: "/features", label: "Features" },
  { to: "/contact", label: "Contact" },
];

const SiteLayout = () => {
  const [open, setOpen] = useState(false);
  const item = ({ isActive }) =>
    `px-2 py-1 font-medium ${isActive ? "text-green-700" : "text-gray-700 hover:text-green-700"}`;
  const btn = "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-white whitespace-nowrap";

  return (
    <div className="min-h-dvh bg-white flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Logo />
          <nav className="hidden lg:flex items-center gap-6">
            {nav.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className={item}>{n.label}</NavLink>)}
          </nav>
          <div className="hidden lg:flex items-center gap-2">
            <Link to="/login" className={`${btn} bg-green-700 hover:bg-green-800`}>👤 Customer</Link>
            <Link to="/admin-login" className={`${btn} bg-blue-900 hover:bg-blue-950`}>🛡️ Admin Panel</Link>
            <Link to="/register" className={`${btn} bg-orange-500 hover:bg-orange-600`}>🏪 Register Your Shop</Link>
          </div>
          <button
            className="lg:hidden w-10 h-10 text-2xl rounded hover:bg-gray-100"
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
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) =>
                `block px-3 py-2 rounded-lg font-medium ${isActive ? "bg-green-50 text-green-700" : "text-gray-700"}`}>
                {n.label}
              </NavLink>
            ))}
            <Link to="/login" className={`${btn} bg-green-700 w-full`}>👤 Customer</Link>
            <Link to="/shop-login" className={`${btn} bg-green-900 w-full`}>🏪 Shop Owner Login</Link>
            <Link to="/register" className={`${btn} bg-orange-500 w-full`}>Register Your Shop</Link>
            <Link to="/admin-login" className={`${btn} bg-blue-900 w-full`}>🛡️ Admin Panel</Link>
          </div>
        )}
      </header>

      <main className="flex-1"><Outlet /></main>

      <footer className="bg-green-950 text-green-100">
        <div className="max-w-6xl mx-auto px-4 py-8 grid sm:grid-cols-3 gap-6 text-sm">
          <div>
            <p className="text-white font-bold text-lg">Dukan Saathi</p>
            <p className="mt-1 text-green-200">Apni Dukan, Hamara Saath.</p>
          </div>
          <div className="space-y-1">
            <p className="text-white font-semibold">Quick links</p>
            {nav.map((n) => <Link key={n.to} to={n.to} className="block hover:underline">{n.label}</Link>)}
            <Link to="/shop-login" className="block hover:underline">Shop owner login</Link>
          </div>
          <ContactLinks className="[&_*]:!text-green-100" />
        </div>
      </footer>
    </div>
  );
};

export default SiteLayout;