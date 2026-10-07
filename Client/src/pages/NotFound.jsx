import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-green-50 px-4 text-center">
      <div>
        <p className="text-7xl font-bold text-green-700">404</p>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Page not found</h1>
        <p className="text-gray-600 mt-1">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          to="/dashboard"
          className="inline-block mt-5 bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;