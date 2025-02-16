import { auth } from "auth";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

type UpdateUserBody = {
  name: string;
  image?: string;
  onboardingCompleted?: boolean;
};

const USERNAME_REGEX = /^[a-zA-Z0-9._]+$/;
const MAX_USERNAME_LENGTH = 16;

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await db
    .select({
      onboardingCompleted: users.onboardingCompleted,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .get();

  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = (await req.json()) as UpdateUserBody;
    const { name, image, onboardingCompleted } = body;

    if (onboardingCompleted !== undefined) {
      await db
        .update(users)
        .set({ onboardingCompleted })
        .where(eq(users.id, session.user.id));

      return NextResponse.json({ success: true });
    }

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    // Validate username length
    if (name.length > MAX_USERNAME_LENGTH) {
      return new NextResponse("Username must be 16 characters or less", { status: 400 });
    }

    // Validate username characters
    if (!USERNAME_REGEX.test(name)) {
      return new NextResponse(
        "Username can only contain letters, numbers, dots, and underscores",
        { status: 400 }
      );
    }

    const updateData = {
      name,
    } as const;

    if (image) {
      Object.assign(updateData, { image });
    }

    await db.update(users).set(updateData).where(eq(users.id, session.user.id));

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      console.error("[USER_UPDATE]", error.message);
    } else {
      console.error("[USER_UPDATE]", "An unknown error occurred");
    }
    return new NextResponse("Internal Error", { status: 500 });
  }
}
