import { defineConfig as zdefiniujKonfiguracje } from "vitest/config";
export default zdefiniujKonfiguracje({
  test: {
    environment: "node",
    include: ["testy/vertical-slice.test.ts", "testy/kampania.test.ts"],
    testTimeout: 60000,
  },
});
