import { useState } from "react";

// Turn this on after Google/Microsoft OAuth is implemented
const SOCIAL_LOGIN_ENABLED = false;

export const Logo = () => (
  <div className="flex items-center gap-3">
    <img src="/favicon.svg" alt="" width="44" height="44" />
    <div>
      <p className="text-2xl font-bold text-green-700 leading-tight">Dukan Saathi</p>
      <p className="text-xs text-gray-600">Aapki Dukan, Hamara Saath</p>
    </div>
  </div>
);

const features = [
  { icon: "📦", title: "Stock Management", text: "Apne saman ka hisab rakhe" },
  { icon: "📊", title: "Sales & Reports", text: "Roz ki bikri ki jankari paaye" },
  { icon: "👥", title: "Customer Management", text: "Apne graahakon se jude rahe" },
  { icon: "☁️", title: "Kabhi bhi, Kahin bhi", text: "Mobile aur Desktop dono par" },
];

export const AuthLayout = ({ heading, intro, children }) => (
  <div className="min-h-dvh bg-gradient-to-br from-green-50 via-white to-green-100 lg:grid lg:grid-cols-2">
    {/* Left: branding */}
    <section className="px-6 pt-6 lg:p-12 lg:flex lg:flex-col">
      <Logo />

      <div className="hidden lg:block mt-12">
        <h1 className="text-4xl xl:text-5xl font-extrabold text-gray-900 leading-tight">
          {heading}
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-md">{intro}</p>

        <ul className="mt-8 space-y-4">
          {features.map((f) => (
            <li key={f.title} className="flex items-center gap-4">
              <span className="w-12 h-12 rounded-full bg-white shadow flex items-center justify-center text-2xl">
                {f.icon}
              </span>
              <div>
                <p className="font-semibold text-gray-800">{f.title}</p>
                <p className="text-sm text-gray-600">{f.text}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-8xl" aria-hidden="true">🏪</p>
      </div>
    </section>

    {/* Right: form card */}
    <section className="flex items-center justify-center p-4 sm:p-6 lg:p-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        {children}
      </div>
    </section>
  </div>
);

export const Field = ({ icon, right, ...props }) => (
  <div className="relative">
    <span
      className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-gray-400 pointer-events-none"
      aria-hidden="true"
    >
      {icon}
    </span>
    <input
      {...props}
      className="w-full bg-white border border-gray-300 rounded-lg py-3 pl-11 pr-11 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
    />
    {right}
  </div>
);

export const PasswordField = (props) => {
  const [show, setShow] = useState(false);
  return (
    <Field
      icon="🔒"
      type={show ? "text" : "password"}
      right={
        <button
          type="button"
          onClick={() => setShow(!show)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded hover:bg-gray-100"
        >
          {show ? "🙈" : "👁"}
        </button>
      }
      {...props}
    />
  );
};

export const ErrorBox = ({ message }) =>
  message ? (
    <p role="alert" className="bg-red-100 text-red-700 text-sm p-3 rounded-lg">
      {message}
    </p>
  ) : null;

export const SubmitButton = ({ loading, children }) => (
  <button
    disabled={loading}
    className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 disabled:opacity-60"
  >
    {loading ? "Please wait..." : children}
  </button>
);

export const SocialButtons = () => {
  if (!SOCIAL_LOGIN_ENABLED) return null;
  const btn =
    "w-full border border-gray-300 rounded-lg py-3 font-medium hover:bg-gray-50";
  return (
    <>
      <div className="flex items-center gap-3 my-5 text-sm text-gray-500">
        <span className="flex-1 border-t" /> OR <span className="flex-1 border-t" />
      </div>
      <div className="space-y-3">
        <button type="button" className={btn}>Continue with Google</button>
        <button type="button" className={btn}>Continue with Microsoft</button>
      </div>
    </>
  );
};