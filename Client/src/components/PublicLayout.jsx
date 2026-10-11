import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PublicLayout = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-dvh bg-green-50">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between gap-3 sticky top-0 z-10">
        <Link to="/shops" className="flex items-center gap-2 min-w-0">
          <img src="/favicon.svg" alt="" width="32" height="32" />
          <span className="font-bold text-green-700 truncate">Dukan Saathi</span>
        </Link>
        <Link to={user ? "/dashboard" : "/login"} className="text-sm text-green-700 font-medium whitespace-nowrap">
          {user ? "My Dashboard" : "Shop owner login"}
        </Link>
      </header>
      <main className="max-w-5xl mx-auto p-4 pb-28">
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;