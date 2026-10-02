import { defineConfig as zdefiniujKonfiguracje } from "vitest/config";

export default zdefiniujKonfiguracje({
  test: { environment: "node", include: ["testy/**/*.test.ts"] },
});
