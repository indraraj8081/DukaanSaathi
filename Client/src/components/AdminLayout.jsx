import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";

const links = [
  { to: "/admin", label: "Dashboard", icon: "🏠", end: true },
  { to: "/admin/shops", label: "Shops", icon: "🏪" },
  { to: "/admin/customers", label: "Customers", icon: "👥" },
  { to: "/admin/orders", label: "Orders", icon: "🛒" },
  { to: "/admin/products", label: "Products", icon: "📦" },
];

const isDesktop = () => window.innerWidth >= 1024;

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [open, setOpen] = useState(isDesktop);
  const [bellOpen, setBellOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [query, setQuery] = useState("");
  const bellRef = useRef(null);
  const menuRef = useRef(null);

  // Refresh the bell numbers and close the drawer (on phones) when the page changes
  useEffect(() => {
    API.get("/api/admin/stats").then((r) => setStats(r.data)).catch(() => {});
    if (!isDesktop()) setOpen(false);
  }, [pathname]);

  // Close dropdowns when clicking anywhere else
  useEffect(() => {
    const onClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const pendingShops = stats?.pendingShops || 0;
  const pendingOrders = stats?.pendingOrders || 0;
  const alerts = pendingShops + pendingOrders;

  const search = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) navigate(`/admin/shops?status=all&search=${encodeURIComponent(q)}`);
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
      isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
    }`;

  return (
    <div className="min-h-dvh bg-slate-50">
      {open && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 max-w-[85vw] bg-slate-900 p-4 flex flex-col overflow-y-auto transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Link to="/admin" className="flex items-center gap-3 px-2 mb-6">
          <img src="/favicon.svg" alt="" width="40" height="40" />
          <div>
            <p className="text-white font-bold leading-tight">Dukan Saathi</p>
            <p className="text-xs text-slate-400">Admin</p>
          </div>
        </Link>

        <nav className="flex-1 space-y-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              <span>{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className={open ? "lg:pl-64" : ""}>
        <header className="bg-white shadow-sm px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="w-10 h-10 text-2xl rounded hover:bg-gray-100 shrink-0"
          >
            ☰
          </button>

          <form onSubmit={search} className="flex-1 min-w-0 max-w-md">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="🔍 Search shops..."
              className="w-full bg-slate-100 rounded-lg px-4 py-2"
            />
          </form>

          <div className="ml-auto flex items-center gap-2">
            {/* Bell */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => { setBellOpen(!bellOpen); setMenuOpen(false); }}
                aria-label="Notifications"
                className="relative w-10 h-10 text-xl rounded-full hover:bg-gray-100"
              >
                🔔
                {alerts > 0 && (
                  <span className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
                    {alerts}
                  </span>
                )}
              </button>
              {bellOpen && (
                <div className="absolute right-0 mt-2 w-72 max-w-[90vw] bg-white rounded-xl shadow-lg border p-2 text-sm">
                  {alerts === 0 ? (
                    <p className="p-3 text-gray-500">Nothing needs your attention.</p>
                  ) : (
                    <>
                      {pendingShops > 0 && (
                        <Link to="/admin/shops?status=pending" onClick={() => setBellOpen(false)} className="block p-3 rounded-lg hover:bg-orange-50">
                          ⏳ <b>{pendingShops}</b> shop(s) waiting for approval
                        </Link>
                      )}
                      {pendingOrders > 0 && (
                        <Link to="/admin/orders?status=placed" onClick={() => setBellOpen(false)} className="block p-3 rounded-lg hover:bg-yellow-50">
                          🛵 <b>{pendingOrders}</b> order(s) not yet accepted by shops
                        </Link>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => { setMenuOpen(!menuOpen); setBellOpen(false); }}
                className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-gray-100"
              >
                <Avatar name={user.name} size={36} />
                <span className="hidden sm:block text-left leading-tight">
                  <span className="block text-sm font-semibold text-gray-800 truncate max-w-32">{user.name}</span>
                  <span className="block text-xs text-gray-500">Admin</span>
                </span>
                <span className="text-gray-500 text-xs">▾</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border p-2 text-sm">
                  <p className="px-3 py-2 text-gray-500 truncate">{user.email}</p>
                  <button onClick={logout} className="w-full text-left px-3 py-2 rounded-lg text-red-600 hover:bg-red-50">
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;