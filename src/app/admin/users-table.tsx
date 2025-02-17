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
import { ShieldCheck } from "lucide-react";
import { useUsers } from "../hooks/useUsers";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { type User } from "../actions/users";
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

function UserDetailsDialog({ user, open, onOpenChange }: { 
  user: User; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Benutzer Details</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-6">
          {/* User Profile Section */}
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.image ?? undefined} />
              <AvatarFallback>
                {user.name?.slice(0, 2).toUpperCase() ?? 
                  user.email.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{user.name ?? "Unnamed"}</h3>
                {user.isAdmin && (
                  <span className="flex items-center gap-1 text-sm text-primary">
                    <ShieldCheck className="h-4 w-4" />
                    Admin
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Registriert am {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="rounded-lg border p-4">
            <h4 className="mb-4 font-medium">Statistiken</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Gelöste Punchlines</p>
                <p className="text-2xl font-bold">{user.solvedCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <span
                  className={`mt-2 inline-block rounded-full px-2 py-1 text-xs font-medium ${
                    user.onboardingCompleted
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }`}
                >
                  {user.onboardingCompleted ? "Aktiv" : "Neu"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AnonymousUsersCard() {
  const [timeSpan, setTimeSpan] = useState<TimeSpan>("24h");
  const { data: stats, isLoading } = useAnonymousStats(timeSpan);

  if (isLoading || !stats) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Anonyme Benutzer</CardTitle>
            <Select value={timeSpan} onValueChange={(value: string) => setTimeSpan(value as TimeSpan)}>
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
          <CardDescription>
            Statistiken über nicht angemeldete Benutzer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-muted-foreground">Lade Statistiken...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Anonyme Benutzer</CardTitle>
          <Select value={timeSpan} onValueChange={(value: string) => setTimeSpan(value as TimeSpan)}>
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
        <CardDescription>
          Statistiken über nicht angemeldete Benutzer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Aktive Sessions</p>
            <p className="text-2xl font-bold">{stats.activeSessions}</p>
            <p className="text-xs text-muted-foreground">von {stats.totalSessions} Gesamt</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Konversionsrate</p>
            <p className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">zu registrierten Nutzern</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Erfolgsquote</p>
            <p className="text-2xl font-bold">{stats.correctGuessRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">richtige Antworten</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h4 className="mb-4 text-sm font-medium">Letzte Aktivitäten</h4>
          <div className="space-y-4">
            {stats.recentActivity.map((session) => (
              <div key={session.id} className="rounded-lg border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="font-medium">Session {session.id.slice(0, 8)}</p>
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
                        ? ((session.correctGuesses / session.totalPlays) * 100).toFixed(1)
                        : "0"
                      }% Erfolgsquote
                    </p>
                  </div>
                </div>
                {session.activities.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {session.activities.map((activity, index) => (
                      <div key={index} className="text-sm">
                        <span className="text-muted-foreground">
                          {activity.timestamp.toLocaleTimeString()}: 
                        </span>{" "}
                        {activity.type === "play" ? (
                          "Neue Runde gestartet"
                        ) : activity.type === "correct_guess" ? (
                          <span className="text-green-600">
                            Richtige Antwort: &quot;{activity.guess}&quot;
                          </span>
                        ) : (
                          <span className="text-red-600">
                            Falsche Antwort: &quot;{activity.guess}&quot;
                          </span>
                        )}
                        {activity.punchline && (
                          <span className="text-muted-foreground">
                            {" "}
                            für &quot;{activity.punchline.line}&quot;
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function UsersTable() {
  const { data: users, isLoading } = useUsers();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  if (isLoading) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-muted-foreground">Lade Benutzer...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Benutzer</h1>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Benutzer</TableHead>
              <TableHead>E-Mail</TableHead>
              <TableHead className="w-[200px]">Gelöste Punchlines</TableHead>
              <TableHead className="w-[200px]">Registriert am</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow 
                key={user.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedUser(user)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.image ?? undefined} />
                      <AvatarFallback>
                        {user.name?.slice(0, 2).toUpperCase() ??
                          user.email.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {user.name ?? "Unnamed"}
                      </span>
                      {user.isAdmin && (
                        <span className="flex items-center gap-1 text-sm text-primary">
                          <ShieldCheck className="h-3 w-3" />
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.solvedCount} Punchlines</TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      user.onboardingCompleted
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    }`}
                  >
                    {user.onboardingCompleted ? "Aktiv" : "Neu"}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AnonymousUsersCard />

      {selectedUser && (
        <UserDetailsDialog
          user={selectedUser}
          open={!!selectedUser}
          onOpenChange={(open) => !open && setSelectedUser(null)}
        />
      )}
    </div>
  );
}
