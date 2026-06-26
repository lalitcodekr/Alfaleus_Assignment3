import { betterAuth } from "better-auth";

export const auth = betterAuth({
    database: process.env.DATABASE_URL!,
    secret: process.env.BETTER_AUTH_SECRET!,
    emailAndPassword: {
        enabled: true,
    },
});