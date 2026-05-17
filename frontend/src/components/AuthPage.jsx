import { useState } from "react";
import { login, register } from "../api/auth";
import { useAuth } from "../context/auth-context";

export default function AuthPage() {
  const { signIn } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isLogin = mode === "login";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setBusy(true);
    try {
      const fn = isLogin ? login : register;
      const data = await fn(username.trim(), password);
      signIn(data.access_token, data.user);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1 className="logo">Flashcards</h1>
        <p className="auth-sub">
          {isLogin ? "Sign in to study your decks." : "Create an account to get started."}
        </p>

        {error && <p className="modal-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <label>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your name"
              autoFocus
              autoComplete="username"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </label>
          <button type="submit" className="btn primary full" disabled={busy}>
            {busy ? "Please wait…" : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? "New here?" : "Already have an account?"}{" "}
          <button
            className="link-btn"
            onClick={() => {
              setMode(isLogin ? "register" : "login");
              setError("");
            }}
          >
            {isLogin ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
