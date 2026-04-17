export const getApiKey = () => {
  return import.meta.env.VITE_GEMINI_API_KEY || "";
};
