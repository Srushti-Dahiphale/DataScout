import { defineConfig } from "drizzle-kit";
import path from "path";

const DATABASE_URL = process.env.DATABASE_URL || "postgres://datascout:datascout@localhost:5432/datascout";

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL,
  },
});
