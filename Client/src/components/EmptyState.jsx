import { Link } from "react-router-dom";

const EmptyState = ({ icon = "📭", title, message, actionLabel, actionTo, onAction }) => {
  const btn = "inline-block mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700";

  return (
    <div className="bg-white rounded-xl shadow p-8 text-center">
      <p className="text-5xl">{icon}</p>
      <h2 className="text-lg font-semibold text-gray-800 mt-3">{title}</h2>
      {message && <p className="text-gray-500 mt-1">{message}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className={btn}>{actionLabel}</Link>
      )}
      {actionLabel && onAction && (
        <button onClick={onAction} className={btn}>{actionLabel}</button>
      )}
    </div>
  );
};

export default EmptyState;