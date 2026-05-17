import { api } from "./client";

// Learner's own history
export const recordHistory = (cardId, result) =>
  api("/history", { method: "POST", body: { card_id: cardId, result } });

export const getMyHistory = () => api("/history");

export const getMyStats = () => api("/history/stats");

export const clearMyHistory = () => api("/history", { method: "DELETE" });

// Admin-only: every user's history
export const getAllUsers = () => api("/admin/users");

export const getAdminHistory = (userId) =>
  api(userId ? `/admin/history?user_id=${userId}` : "/admin/history");
