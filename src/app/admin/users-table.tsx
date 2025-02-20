"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Eye, ShieldIcon } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { type User } from "~/app/types/user";
import { useAnonymousStats } from "../hooks/useAnalytics";
import { type TimeSpan } from "../actions/analytics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { cn } from "~/lib/utils";
import { type Activity, type ActivityType } from "~/app/types/activity";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface UsersTableProps {
  users: User[];
}

function UserDetailsDialog({
  user,
  open,
  onOpenChange,
}: {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Benutzer Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.image ?? undefined} />
              <AvatarFallback>{user.name?.slice(0, 2) ?? "??"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.name ?? "Unbekannt"}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground">ID: {user.id}</p>
            </div>
          </div>

          <Tabs defaultValue="logged-in" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="logged-in">
                Eingeloggte Aktivitäten
              </TabsTrigger>
              <TabsTrigger value="anonymous">Anonyme Aktivitäten</TabsTrigger>
            </TabsList>

            <TabsContent value="logged-in" className="mt-4">
              <div className="max-h-[400px] space-y-3 overflow-y-auto rounded-md border p-4">
                {user.activities &&
                  user.activities
                    .filter((activity: Activity) => activity.isLoggedIn)
                    .map((activity: Activity, index: number) => {
                      const timestamp = new Date(activity.timestamp);
                      return (
                        <div
                          key={index}
                          className="flex flex-col gap-1 rounded-lg border p-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {getActivityText(activity.type)}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {timestamp.toLocaleString()}
                            </span>
                          </div>
                          {activity.punchline && (
                            <div className="text-sm text-muted-foreground">
                              Punchline: &quot;{activity.punchline.line}&quot;
                            </div>
                          )}
                          {activity.guess && (
                            <div className="text-sm text-muted-foreground">
                              Antwort: &quot;{activity.guess}&quot;
                            </div>
                          )}
                        </div>
                      );
                    })}
              </div>
            </TabsContent>

            <TabsContent value="anonymous" className="mt-4">
              <div className="max-h-[400px] space-y-3 overflow-y-auto rounded-md border p-4">
                {user.activities &&
                  user.activities
                    .filter((activity: Activity) => !activity.isLoggedIn)
                    .map((activity: Activity, index: number) => {
                      const timestamp = new Date(activity.timestamp);
                      return (
                        <div
                          key={index}
                          className="flex flex-col gap-1 rounded-lg border p-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {getActivityText(activity.type)}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {timestamp.toLocaleString()}
                            </span>
                          </div>
                          {activity.punchline && (
                            <div className="text-sm text-muted-foreground">
                              Punchline: &quot;{activity.punchline.line}&quot;
                            </div>
                          )}
                          {activity.guess && (
                            <div className="text-sm text-muted-foreground">
                              Antwort: &quot;{activity.guess}&quot;
                            </div>
                          )}
                        </div>
                      );
                    })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getActivityText(type: ActivityType): string {
  switch (type) {
    case "play":
      return "hat eine Runde gespielt";
    case "correct_guess":
      return "hat die richtige Antwort gegeben";
    case "incorrect_guess":
      return "hat eine falsche Antwort gegeben";
    case "quiz_play":
      return "hat eine Quiz-Runde gespielt";
    case "quiz_correct_guess":
      return "hat den Künstler richtig erraten";
    case "quiz_incorrect_guess":
      return "hat den falschen Künstler gewählt";
    case "oauth_click":
      return "hat auf Google Login geklickt";
    case "profile_update":
      return "hat sein Profil aktualisiert";
    case "login":
      return "hat sich eingeloggt";
    case "logout":
      return "hat sich ausgeloggt";
    case "game_start":
      return "hat ein Spiel gestartet";
    case "game_complete":
      return "hat ein Spiel beendet";
    default:
      return "hat eine Aktion ausgeführt";
  }
}

function AnonymousUsersCard() {
  const [timeSpan, setTimeSpan] = useState<TimeSpan>("24h");
  const { data: stats, isLoading } = useAnonymousStats(timeSpan);

  if (isLoading || !stats) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Aktivitäten</CardTitle>
            <Select
              value={timeSpan}
              onValueChange={(value: string) => setTimeSpan(value as TimeSpan)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Zeitraum wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Letzte Stunde</SelectItem>
                <SelectItem value="24h">Letzte 24 Stunden</SelectItem>
                <SelectItem value="7d">Letzte 7 Tage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <CardDescription>Aktivitäten aller Benutzer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-muted-foreground">Lade Aktivitäten...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Aktivitäten</CardTitle>
          <Select
            value={timeSpan}
            onValueChange={(value: string) => setTimeSpan(value as TimeSpan)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Zeitraum wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Letzte Stunde</SelectItem>
              <SelectItem value="24h">Letzte 24 Stunden</SelectItem>
              <SelectItem value="7d">Letzte 7 Tage</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CardDescription>Aktivitäten aller Benutzer</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="anonymous" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="anonymous">Anonyme Benutzer</TabsTrigger>
            <TabsTrigger value="logged-in">Eingeloggte Benutzer</TabsTrigger>
          </TabsList>

          <TabsContent value="anonymous" className="mt-4">
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Aktive Sessions
                </p>
                <p className="text-2xl font-bold">{stats.activeSessions}</p>
                <p className="text-xs text-muted-foreground">
                  von {stats.totalSessions} Gesamt
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Konversionsrate
                </p>
                <p className="text-2xl font-bold">
                  {stats.conversionRate.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  zu registrierten Nutzern
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Erfolgsquote
                </p>
                <p className="text-2xl font-bold">
                  {stats.correctGuessRate.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  richtige Antworten
                </p>
              </div>
            </div>

            <div className="max-h-[600px] space-y-4 overflow-y-auto">
              {stats.recentActivity.map((session) => (
                <div key={session.id} className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        Session {session.id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Zuletzt aktiv: {session.lastSeenAt.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        {session.correctGuesses} / {session.totalPlays} richtig
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.totalPlays > 0
                          ? (
                              (session.correctGuesses / session.totalPlays) *
                              100
                            ).toFixed(1)
                          : "0"}
                        % Erfolgsquote
                      </p>
                    </div>
                  </div>
                  {session.activities.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {[...session.activities]
                        .sort(
                          (a, b) =>
                            b.timestamp.getTime() - a.timestamp.getTime(),
                        )
                        .map((activity, index) => (
                          <div
                            key={index}
                            className="flex flex-col space-y-1 rounded-lg border p-3 text-sm"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                Anonymer Benutzer{" "}
                                {getActivityText(activity.type)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {activity.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                            {activity.punchline && (
                              <div className="text-sm text-muted-foreground">
                                Punchline: &quot;{activity.punchline.line}&quot;
                              </div>
                            )}
                            {activity.guess && (
                              <div
                                className={cn(
                                  "text-sm",
                                  activity.type === "correct_guess"
                                    ? "text-green-600"
                                    : "text-red-600",
                                )}
                              >
                                Antwort: &quot;{activity.guess}&quot;
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="logged-in" className="mt-4">
            <div className="max-h-[600px] space-y-4 overflow-y-auto">
              {stats.recentActivity
                .filter((session) => session.convertedToUser)
                .map((session) => (
                  <div key={session.id} className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={session.user?.image ?? undefined} />
                          <AvatarFallback>
                            {session.user?.name?.slice(0, 2) ?? "??"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {session.user?.name ?? "Unbekannt"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Zuletzt aktiv: {session.lastSeenAt.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          {session.correctGuesses} / {session.totalPlays}{" "}
                          richtig
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {session.totalPlays > 0
                            ? (
                                (session.correctGuesses / session.totalPlays) *
                                100
                              ).toFixed(1)
                            : "0"}
                          % Erfolgsquote
                        </p>
                      </div>
                    </div>
                    {session.activities.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {[...session.activities]
                          .sort(
                            (a, b) =>
                              b.timestamp.getTime() - a.timestamp.getTime(),
                          )
                          .map((activity, index) => (
                            <div
                              key={index}
                              className="flex flex-col space-y-1 rounded-lg border p-3 text-sm"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">
                                  {session.user?.name || "Benutzer"}{" "}
                                  {getActivityText(activity.type)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {activity.timestamp.toLocaleTimeString()}
                                </span>
                              </div>
                              {activity.punchline && (
                                <div className="text-sm text-muted-foreground">
                                  Punchline: &quot;{activity.punchline.line}&quot;
                                </div>
                              )}
                              {activity.guess && (
                                <div
                                  className={cn(
                                    "text-sm",
                                    activity.type === "correct_guess"
                                      ? "text-green-600"
                                      : "text-red-600",
                                  )}
                                >
                                  Antwort: &quot;{activity.guess}&quot;
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default function UsersTable({ users }: UsersTableProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  if (!users || users.length === 0) {
    return (
      <div className="flex h-[450px] items-center justify-center rounded-md border">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Keine Benutzer gefunden</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold">Benutzer</h1>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Benutzer</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>E-Mail</TableHead>
              <TableHead>Registriert am</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow 
                key={user.id}
                className={cn(user.isAdmin && "border-l-4 border-l-primary")}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.image ?? undefined} />
                      <AvatarFallback>
                        {user.name?.slice(0, 2).toUpperCase() ?? "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.name ?? "Unbekannt"}</span>
                      {user.isAdmin && (
                        <ShieldIcon className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">{user.id}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString("de-DE", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
