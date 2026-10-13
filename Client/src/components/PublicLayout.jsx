import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PublicLayout = () => {
  const { user, logout } = useAuth();
  const link = "flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-green-700 whitespace-nowrap";

  return (
    <div className="min-h-dvh bg-green-50/50">
      <header className="bg-white shadow-sm px-4 sm:px-8 py-3 flex items-center justify-between gap-3 sticky top-0 z-20">
        <Link to="/shops" className="flex items-center gap-3 min-w-0">
          <img src="/favicon.svg" alt="" width="44" height="44" />
          <span className="text-2xl font-extrabold truncate">
            <span className="text-gray-900">Dukan </span>
            <span className="text-green-700">Saathi</span>
          </span>
        </Link>

        <nav className="flex items-center gap-4 sm:gap-6">
          {user?.role === "customer" && (
            <>
              <Link to="/my-orders" className={link}>
                <span aria-hidden="true">📋</span>
                <span className="hidden sm:inline">My Orders</span>
              </Link>
              <Link to="/account" className={link}>
                <span aria-hidden="true">👤</span>
                <span className="hidden sm:inline">Account</span>
              </Link>
              <button onClick={logout} className={link}>
                <span aria-hidden="true">🚪</span>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          )}
          {user?.role === "shopkeeper" && (
            <Link to="/dashboard" className={link}>My Dashboard</Link>
          )}
          {!user && (
            <>
              <Link to="/login" className={link}>Login</Link>
              <Link to="/signup" className="text-sm bg-green-700 text-white px-4 py-2 rounded-lg whitespace-nowrap hover:bg-green-800">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-6 pb-28">
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;