import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PublicLayout = () => {
  const { user, logout } = useAuth();
  const link = "text-sm text-green-700 font-medium whitespace-nowrap hover:underline";

  return (
    <div className="min-h-dvh bg-green-50">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between gap-3 sticky top-0 z-10">
        <Link to="/shops" className="flex items-center gap-2 min-w-0">
          <img src="/favicon.svg" alt="" width="32" height="32" />
          <span className="font-bold text-green-700 truncate">Dukan Saathi</span>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-4">
          {user?.role === "customer" && (
            <>
              <Link to="/my-orders" className={link}>My Orders</Link>
              <Link to="/account" className={link}>Account</Link>
              <button onClick={logout} className="text-sm text-red-600 font-medium">Logout</button>
            </>
          )}
          {user?.role === "shopkeeper" && <Link to="/dashboard" className={link}>My Dashboard</Link>}
          {!user && (
            <>
              <Link to="/login" className={link}>Login</Link>
              <Link to="/signup" className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg whitespace-nowrap">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>
      <main className="max-w-5xl mx-auto p-4 pb-28">
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;