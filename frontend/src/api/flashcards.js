import { api } from "./client";

export const getFlashcards = () => api("/flashcards");

export const createFlashcard = (data) =>
  api("/flashcards", { method: "POST", body: data });

export const updateFlashcard = (id, data) =>
  api(`/flashcards/${id}`, { method: "PUT", body: data });

export const deleteFlashcard = (id) =>
  api(`/flashcards/${id}`, { method: "DELETE" });
