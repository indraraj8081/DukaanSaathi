import { Link } from "react-router-dom";

const Logo = ({ to = "/" }) => (
  <Link to={to} className="flex items-center gap-3 min-w-0">
    <img src="/favicon.svg" alt="" width="44" height="44" />
    <span className="min-w-0">
      <span className="block text-xl font-extrabold leading-tight truncate">
        <span className="text-gray-900">Dukan </span><span className="text-green-700">Saathi</span>
      </span>
      <span className="block text-xs text-gray-500 truncate">Apni Dukan, Hamara Saath</span>
    </span>
  </Link>
);

export default Logo;