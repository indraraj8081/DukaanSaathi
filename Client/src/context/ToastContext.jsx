import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback(
    (id) => setToasts((t) => t.filter((x) => x.id !== id)),
    []
  );

  const push = useCallback(
    (type, message) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, type, message }]);
      // Errors stay longer because they take more time to read
      setTimeout(() => remove(id), type === "error" ? 5000 : 2500);
    },
    [remove]
  );

  const value = useMemo(
    () => ({
      success: (message) => push("success", message),
      error: (message) => push("error", message),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed top-4 inset-x-4 sm:left-auto sm:right-4 sm:w-80 z-50 space-y-2"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === "error" ? "alert" : "status"}
            className={`flex items-start justify-between gap-3 px-4 py-3 rounded-lg shadow text-white ${
              t.type === "error" ? "bg-red-600" : "bg-green-600"
            }`}
          >
            <span className="wrap-words min-w-0">{t.message}</span>
            <button onClick={() => remove(t.id)} aria-label="Dismiss" className="font-bold">
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);