import { auth } from "auth";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!user?.isAdmin) {
    throw new Error("Not authorized");
  }

  return user;
}
