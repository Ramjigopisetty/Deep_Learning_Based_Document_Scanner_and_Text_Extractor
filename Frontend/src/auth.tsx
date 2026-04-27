import { useState } from "react";

export default function Auth({ onLogin }: { onLogin: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async () => {
    if (!username || !password) {
      setMessage("❌ Please fill all fields");
      return;
    }

    setLoading(true);
    setMessage(null);

    const endpoint = isLogin ? "auth/login" : "auth/signup";
    const url = `${API_URL.replace(/\/$/, "")}/${endpoint}`;

    console.log("API CALL:", url); // 🔍 DEBUG

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      // 🔴 HANDLE NOT FOUND (YOUR MAIN ISSUE)
      if (res.status === 404) {
        setMessage("❌ API route not found (check backend URL)");
        return;
      }

      if (isLogin) {
        if (res.ok && data.access_token) {
          localStorage.setItem("token", data.access_token);

          setMessage("✅ Login successful");

          setUsername("");
          setPassword("");

          setTimeout(() => onLogin(), 800);
        } else {
          setMessage("❌ " + (data.detail || "Invalid credentials"));
        }
      } else {
        if (res.ok) {
          setMessage("✅ Signup successful. Please login");

          setUsername("");
          setPassword("");

          setIsLogin(true);
        } else {
          setMessage("❌ " + (data.detail || "Signup failed"));
        }
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Backend not reachable (check API URL)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-500">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-xl w-[350px] text-white">

        <h2 className="text-xl font-bold mb-4 text-center">
          {isLogin ? "Login" : "Signup"}
        </h2>

        <input
          className="w-full mb-3 p-2 rounded bg-white/20 text-white placeholder-white/70 outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          className="w-full mb-4 p-2 rounded bg-white/20 text-white placeholder-white/70 outline-none focus:ring-2 focus:ring-indigo-300"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {message && (
          <div
            className={`mb-3 text-sm text-center font-medium ${
              message.includes("❌") ? "text-red-400" : "text-green-400"
            }`}
          >
            {message}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 transition py-2 rounded-lg flex justify-center items-center gap-2 disabled:opacity-60"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </>
          ) : (
            isLogin ? "Login" : "Signup"
          )}
        </button>

        <p
          className="text-sm text-center mt-4 cursor-pointer text-indigo-200 hover:text-white transition"
          onClick={() => {
            setIsLogin(!isLogin);
            setMessage(null);
          }}
        >
          {isLogin
            ? "Don't have an account? Signup"
            : "Already have an account? Login"}
        </p>
      </div>
    </div>
  );
}