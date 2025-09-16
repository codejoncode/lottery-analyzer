import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  build: {
    rollupOptions: {
      external: (id) => {
        // Exclude server-side services that use Node.js modules
        if (id.includes('Pick3DataManager') ||
            id.includes('Pick3DataSyncService') ||
            id.includes('Pick3DataScraper') ||
            id.includes('Pick3DataProcessor')) {
          return true;
        }
        return false;
      }
    }
  }
});
