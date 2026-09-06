import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import prisma from './prisma.js';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://127.0.0.1:3000',
  ],
  secret: process.env.BETTER_AUTH_SECRET || 'super-secret-token-key-aura-lifestyle-98437598475',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:5000',
});

export default auth;
