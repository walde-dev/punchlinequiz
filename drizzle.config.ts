import { type Config } from "drizzle-kit";

import { env } from "~/env";

export default {
  schema: "./src/server/db/schema.ts",
  dialect: "sqlite",
  out: "./drizzle",
  verbose: true,
  strict: true,
  dbCredentials: {
    url: env.DATABASE_URL.replace("file:", ""),
  },
} satisfies Config;
