import { useEffect, useState } from "react";
import API from "./api/axios";

function App() {
  const [msg, setMsg] = useState("Loading...");

  useEffect(() => {
    API.get("/")
      .then((res) => setMsg(res.data.message))
      .catch(() => setMsg("Backend se connect nahi hua"));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-green-700">DukaanSaathi 🛒</h1>
        <p className="mt-2 text-gray-600">Stock bhi, Bill bhi, Hisaab bhi</p>
        <p className="mt-4 text-orange-600 font-medium">{msg}</p>
      </div>
    </div>
  );
}

export default App;