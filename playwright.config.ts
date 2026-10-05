import { defineConfig as zdefiniujKonfiguracje } from "@playwright/test";

export default zdefiniujKonfiguracje({
  testDir: "./testy/e2e",
  workers: 1,
  timeout: 60000,
  globalSetup: "./testy/e2e/serwer-podgladu.ts",
  use: {
    baseURL: "http://127.0.0.1:4173",
    browserName: "chromium",
    trace: "retain-on-failure",
  },
});
