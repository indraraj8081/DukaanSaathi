import { Link } from "react-router-dom";
import Logo from "./Logo";

const AuthShell = ({ tone = "green", art, points = [], children }) => {
  const bg = tone === "blue" ? "from-blue-50 via-white to-blue-100" : "from-green-50 via-white to-green-100";
  return (
    <div className={`min-h-dvh bg-gradient-to-br ${bg}`}>
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
        <Logo />
        <Link to="/" className="text-sm font-medium text-gray-700 hover:text-green-700 whitespace-nowrap">← Back to Home</Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-10 grid lg:grid-cols-2 gap-6 items-center">
        <div className="hidden lg:block">
          <p className="text-8xl text-center" aria-hidden="true">{art}</p>
          {points.length > 0 && (
            <ul className="mt-6 bg-white/80 rounded-2xl shadow p-4 space-y-3">
              {points.map(([icon, text]) => (
                <li key={text} className="flex items-center gap-3 text-gray-700">
                  <span className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">{icon}</span>{text}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 w-full max-w-md mx-auto">{children}</div>
      </div>
    </div>
  );
};

export default AuthShell;