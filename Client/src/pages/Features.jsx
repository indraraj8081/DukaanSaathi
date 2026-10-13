import { Link } from "react-router-dom";
import useDocumentTitle from "../hooks/useDocumentTitle";

const features = [
  ["🛒", "Online Shopping", "Customer products browse karke order kar sakta hai."],
  ["📦", "Stock Management", "Shopkeeper apna stock easy manage kar sakta hai."],
  ["📋", "Order Management", "Orders dekh aur update kar sakta hai."],
  ["🔔", "Order Notifications", "Naya order aane par dashboard par turant alert milta hai."],
  ["🛵", "Self Delivery", "Shopkeeper apne orders ki delivery khud karta hai."],
  ["📊", "Sales & Reports", "Sales, revenue aur profit track kar sakta hai."],
  ["👥", "Customer Management", "Udhaar aur customer details easily manage karein."],
  ["🛡️", "Admin Dashboard", "Admin shops, customers aur platform manage karta hai."],
  ["🔒", "Secure Login", "Har role ke liye alag login aur alag access."],
];

const Features = () => {
  useDocumentTitle("Features");
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-4xl font-extrabold text-gray-900">Platform Features</h1>
      <p className="text-gray-600 mt-2">Woh sab kuch jo local dukandaaron aur customers dono ke liye zaruri hai.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {features.map(([icon, t, d]) => (
          <div key={t} className="bg-white rounded-xl shadow p-5">
            <span className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl">{icon}</span>
            <h2 className="font-bold text-gray-900 mt-3">{t}</h2>
            <p className="text-sm text-gray-600 mt-1">{d}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-green-50 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-bold text-gray-900 text-lg">Ready to take your shop online?</p>
          <p className="text-gray-600 text-sm">Register karein aur approval ke baad apna business badhayein.</p>
        </div>
        <Link to="/register" className="bg-green-700 text-white font-semibold px-6 py-3 rounded-lg whitespace-nowrap hover:bg-green-800">
          Register Your Shop →
        </Link>
      </div>
    </div>
  );
};

export default Features;