"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import PunchlinesTable from "./punchlines-table";
import Analytics from "./analytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import UsersTable from "./users-table";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated" || (status === "authenticated" && !session?.user?.isAdmin)) {
      router.push("/");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="container flex h-[200px] items-center justify-center">
        <p className="text-muted-foreground">Lade...</p>
      </div>
    );
  }

  if (!session?.user?.isAdmin) {
    return null;
  }

  return (
    <div className="container py-8">
      <Tabs defaultValue="punchlines">
        <TabsList>
          <TabsTrigger value="punchlines">Punchlines</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="users">Benutzer</TabsTrigger>
        </TabsList>
        <TabsContent value="punchlines" className="mt-6">
          <PunchlinesTable />
        </TabsContent>
        <TabsContent value="analytics" className="mt-6">
          <Analytics />
        </TabsContent>
        <TabsContent value="users" className="mt-6">
          <UsersTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
