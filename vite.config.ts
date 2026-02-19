import { defineConfig, type Plugin } from "vite";
import { resolve } from "node:path";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import tailwindcss from "@tailwindcss/vite";

const exercicesPath = resolve(__dirname, "exercices");

const getExerciseInputs = () => {
  const inputs: Record<string, string> = {
    main: resolve(__dirname, "index.html"),
  };
  if (existsSync(exercicesPath)) {
    const items = readdirSync(exercicesPath, { withFileTypes: true });
    for (const item of items) {
      if (item.isDirectory()) {
        const indexPath = resolve(exercicesPath, item.name, "index.html");
        if (existsSync(indexPath)) {
          inputs[item.name] = indexPath;
        }
      }
    }
  }
  return inputs;
};

const exercicesListPlugin = (): Plugin => {
  const getExercices = () => {
    if (!existsSync(exercicesPath)) return [];
    return readdirSync(exercicesPath, { withFileTypes: true })
      .filter((item) => item.isDirectory())
      .map((item) => {
        const indexPath = resolve(exercicesPath, item.name, "index.html");
        if (!existsSync(indexPath)) return null;
        const html = readFileSync(indexPath, "utf-8");
        const titleMatch = html.match(/<title>(.*?)<\/title>/);
        const title = titleMatch ? titleMatch[1] : item.name;
        return { name: item.name, title };
      })
      .filter(Boolean) as { name: string; title: string }[];
  };

  return {
    name: "exercices-list",
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        if (
          !ctx.filename.endsWith("index.html") ||
          ctx.filename.includes("exercices")
        ) {
          return html;
        }
        const exercices = getExercices();
        const links = exercices
          .map(
            (ex) =>
              `<a class="btn" href="./exercices/${ex.name}/">${ex.title}</a>`,
          )
          .join("\n");
        return html.replace("<!-- EXERCICES_LIST -->", links);
      },
    },
  };
};

export default defineConfig({
  plugins: [tailwindcss(), exercicesListPlugin()],
  base: "./",
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    rollupOptions: {
      input: getExerciseInputs(),
    },
  },
});
