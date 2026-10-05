import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h1 className="text-2xl font-bold text-green-700">Hello, {user.name}! 👋</h1>
      <p className="text-gray-600 mt-1">Summary cards and charts will come in Step 6.</p>
    </div>
  );
};

export default Dashboard;