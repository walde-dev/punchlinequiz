"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import PunchlinesTable from "./punchlines-table";
import Analytics from "./analytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import UsersTable from "./users-table";
import QuizPunchlinesTable from "./quiz-punchlines-table";
import { useUsers } from "~/app/hooks/useUsers";

const VALID_TABS = ["finishing-lines", "quiz", "analytics", "users"] as const;
type TabValue = (typeof VALID_TABS)[number];

function AdminTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const { data: users = [], isLoading: isLoadingUsers } = useUsers();
  
  // Validate and set default tab
  const activeTab = VALID_TABS.includes(tab as TabValue) 
    ? tab as TabValue 
    : "finishing-lines";

  const handleTabChange = (value: string) => {
    router.push(`/admin?tab=${value}`);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="finishing-lines">Finishing Lines</TabsTrigger>
        <TabsTrigger value="quiz">Quiz</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="users">Benutzer</TabsTrigger>
      </TabsList>
      <TabsContent value="finishing-lines" className="mt-6">
        <PunchlinesTable />
      </TabsContent>
      <TabsContent value="quiz" className="mt-6">
        <QuizPunchlinesTable />
      </TabsContent>
      <TabsContent value="analytics" className="mt-6">
        <Analytics />
      </TabsContent>
      <TabsContent value="users" className="mt-6">
        {isLoadingUsers ? (
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-muted-foreground">Lade Benutzer...</p>
          </div>
        ) : (
          <UsersTable users={users} />
        )}
      </TabsContent>
    </Tabs>
  );
}

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
      <Suspense 
        fallback={
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-muted-foreground">Lade Tabs...</p>
          </div>
        }
      >
        <AdminTabs />
      </Suspense>
    </div>
  );
}
