/**
 * Autopsy AI - Centralized API Configuration
 * 
 * In development:  Vite proxy forwards /api/* → http://127.0.0.1:8000 (no CORS)
 * In production:   Set VITE_API_URL to your deployed backend URL
 * 
 * Using nullish coalescing (??) so an explicitly-set empty string is kept as-is.
 * An empty string BASE_URL means "same origin" which goes through the Vite proxy.
 */
export const BASE_URL = import.meta.env.VITE_API_URL ?? "";
