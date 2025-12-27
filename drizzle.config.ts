import type { Config } from "drizzle-kit";

export default {
  schema: "./electron/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "sqlite.db",
  },
} satisfies Config;
