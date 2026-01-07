import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8081,

    // 🔥 REQUIRED FOR REACT ROUTER — FIXES ALL 404 ON REFRESH
    historyApiFallback: true,
  },

  plugins: [
    react()
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
