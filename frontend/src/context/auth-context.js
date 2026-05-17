import { createContext, useContext } from "react";

// Context + hook live here (no component export) so React Fast Refresh
// keeps working for the provider component in AuthContext.jsx.
export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}
