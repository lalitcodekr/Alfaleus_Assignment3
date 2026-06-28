import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/client";

export const auth = betterAuth({
    trustedOrigins: ["http://localhost:3000", process.env.FRONTEND_URL || ""],
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    secret: process.env.BETTER_AUTH_SECRET!,
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID || "",
            clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
        },
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }
    }
});
