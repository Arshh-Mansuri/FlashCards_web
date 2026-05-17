import { api } from "./client";

export const register = (username, password) =>
  api("/auth/register", { method: "POST", body: { username, password } });

export const login = (username, password) =>
  api("/auth/login", { method: "POST", body: { username, password } });

export const fetchMe = () => api("/auth/me");
