import obslugaReact from "@vitejs/plugin-react";
import { defineConfig as zdefiniujKonfiguracje } from "vitest/config";

export default zdefiniujKonfiguracje({
  plugins: [obslugaReact()],
  test: { environment: "jsdom", include: ["testy/*.test.tsx"] },
});
