import { useEffect, useState } from "react";
import { setToken } from "../api/client";
import { AuthContext } from "./auth-context";

const USER_KEY = "flashcards_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  function signIn(token, userObj) {
    setToken(token);
    localStorage.setItem(USER_KEY, JSON.stringify(userObj));
    setUser(userObj);
  }

  function signOut() {
    setToken(null);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  // The api client fires this when a request returns 401 (expired token).
  useEffect(() => {
    function onExpired() {
      localStorage.removeItem(USER_KEY);
      setUser(null);
    }
    window.addEventListener("auth-expired", onExpired);
    return () => window.removeEventListener("auth-expired", onExpired);
  }, []);

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
