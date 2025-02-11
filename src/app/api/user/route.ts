import { auth } from "auth";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

type UpdateUserBody = {
  name: string;
  image?: string;
};

export async function PATCH(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = (await req.json()) as UpdateUserBody;
    const { name, image } = body;

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
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
