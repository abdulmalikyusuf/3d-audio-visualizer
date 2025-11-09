import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import glsl from "vite-plugin-glsl";
import checker from "vite-plugin-checker";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    checker({
      typescript: {
        buildMode: false, // Ensure it runs during build in development
      },
    }),
    glsl({
      include: ["**/*.glsl", "**/*.vert", "**/*.frag"],
      minify: true,
      importKeyword: "#include",
    }),
  ],
});
