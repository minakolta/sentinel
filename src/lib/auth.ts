import { NextAuthOptions, Session } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/db";

// Role constants
export const Role = {
  ADMIN: "ADMIN",
  USER: "USER",
} as const;

export type RoleType = (typeof Role)[keyof typeof Role];

// Extend the built-in session/user types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: RoleType;
    };
  }

  interface User {
    id: string;
    role: RoleType;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: RoleType;
  }
}

/**
 * Check if an email domain is in the allowed list
 */
async function isAllowedDomain(email: string): Promise<boolean> {
  const setting = await prisma.setting.findUnique({
    where: { key: "org.allowedDomains" },
  });

  if (!setting) {
    // If no domains configured, allow all (for initial setup)
    return true;
  }

  try {
    const domains = JSON.parse(setting.value) as string[];
    const emailDomain = email.split("@")[1];
    return emailDomain ? domains.includes(emailDomain) : false;
  } catch {
    return true; // If parsing fails, allow (fail open for initial setup)
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return false;
      }

      if (!user.email) {
        return false;
      }

      // Check domain restriction
      const allowed = await isAllowedDomain(user.email);
      if (!allowed) {
        return false;
      }

      // Create or update user in database
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (!existingUser) {
        // Check if this is the first user (make them admin)
        const userCount = await prisma.user.count();
        const role = userCount === 0 ? Role.ADMIN : Role.USER;

        await prisma.user.create({
          data: {
            email: user.email,
            name: user.name,
            image: user.image,
            role,
          },
        });
      } else {
        // Update user info on each login
        await prisma.user.update({
          where: { email: user.email },
          data: {
            name: user.name,
            image: user.image,
          },
        });
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        // Initial sign in
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email ?? "" },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role as RoleType;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
};

/**
 * Require authentication - throws if not authenticated
 */
export function requireAuth(session: Session | null): asserts session is Session {
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
}

/**
 * Require specific role(s) - throws if not authorized
 */
export function requireRole(session: Session | null, roles: RoleType[]): asserts session is Session {
  requireAuth(session);
  
  if (!roles.includes(session.user.role)) {
    throw new Error("Forbidden");
  }
}

/**
 * Check if user has admin role
 */
export function isAdmin(session: Session | null): boolean {
  return session?.user?.role === Role.ADMIN;
}
