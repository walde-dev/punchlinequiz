import { redirect } from "next/navigation";
import { auth } from "auth";
import PunchlinesTable from "./punchlines-table";
import { SpotifyStatus } from "~/components/spotify/spotify-status";
import { Suspense } from "react";

// @ts-expect-error - Next.js 15 page props type issue
export default async function AdminPage(props) {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  return (
    <main className="mx-auto w-full space-y-6 py-6">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-5xl font-bold">Admin Dashboard</h1>
        <Suspense>
          <SpotifyStatus userId={session.user.id} searchParams={props.searchParams} />
        </Suspense>
      </div>

      <PunchlinesTable />
    </main>
  );
}
