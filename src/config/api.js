// src/config/api.js
export const getApiKey = () => {
  // On récupère la valeur en temps réel à chaque appel de la fonction
  return import.meta.env.VITE_GEMINI_API_KEY || "";
};
