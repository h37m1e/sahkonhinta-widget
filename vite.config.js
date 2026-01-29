import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "sahkonhinta-widget",
  plugins: [react()],
});