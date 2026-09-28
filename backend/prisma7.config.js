import "dotenv/config";
import { defineConfig } from "prisma/config";
export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
    },
    datasource: {
        url: process.env["DATABASE_URL"],
    },
});
export const databaseUrl = process.env["DATABASE_URL"];
//# sourceMappingURL=prisma7.config.js.map