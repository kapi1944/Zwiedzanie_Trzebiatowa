import obslugaReact from "@vitejs/plugin-react";
import { defineConfig as zdefiniujKonfiguracje } from "vite";

export default zdefiniujKonfiguracje({
  plugins: [obslugaReact()],
  build: { manifest: true },
});
