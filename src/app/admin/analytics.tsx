"use client";

import {
  usePunchlineAnalytics,
  useOverallStats,
  useAnonymousStats,
} from "../hooks/useAnalytics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import {
  Users,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Edit2,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Progress } from "~/components/ui/progress";
import { useState } from "react";
import { cn } from "~/lib/utils";
import React from "react";
import { deleteWrongGuess, type TimeSpan } from "../actions/analytics";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { ScrollArea } from "~/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import EditPunchlineDialog from "./analytics/edit-punchline-dialog";
import { toast } from "~/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

function StatCard({
  title,
  value,
  change,
  icon: Icon,
}: {
  title: string;
  value: number;
  change: number;
  icon: React.ElementType;
}) {
  const formattedChange = change.toFixed(1);
  const isPositive = change > 0;
  const isNeutral = change === 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {!isNeutral && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-xs font-medium",
                isPositive ? "text-green-600" : "text-red-600",
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {formattedChange}%
            </span>
          )}
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
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
        <CardDescription>
          Statistiken über nicht angemeldete Benutzer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
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
                      {(
                        (session.correctGuesses / session.totalPlays) *
                        100
                      ).toFixed(1)}
                      % Erfolgsquote
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
                        ) : activity.type === "oauth_click" ? (
                          <span className="text-blue-600">
                            Google OAuth Button geklickt
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

export default function Analytics() {
  const queryClient = useQueryClient();
  const [timeSpan, setTimeSpan] = useState<TimeSpan>("24h");
  const { data: analytics, isLoading: isLoadingAnalytics } =
    usePunchlineAnalytics();
  const { data: stats, isLoading: isLoadingStats } = useOverallStats(timeSpan);
  const [expandedPunchlines, setExpandedPunchlines] = useState<number[]>([]);
  const [editPunchlineId, setEditPunchlineId] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: "line" | "song" | "totalSolves" | "solvePercentage";
    direction: "asc" | "desc";
  }>({ key: "totalSolves", direction: "desc" });

  const toggleExpand = (id: number) => {
    setExpandedPunchlines((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const handleSort = (key: typeof sortConfig.key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  const sortedAnalytics = React.useMemo(() => {
    if (!analytics) return [];

    return [...analytics].sort((a, b) => {
      const direction = sortConfig.direction === "asc" ? 1 : -1;

      switch (sortConfig.key) {
        case "line":
          return direction * a.line.localeCompare(b.line);
        case "song":
          const songA = `${a.song.artist} - ${a.song.name}`;
          const songB = `${b.song.artist} - ${b.song.name}`;
          return direction * songA.localeCompare(songB);
        case "totalSolves":
          return direction * (a.totalSolves - b.totalSolves);
        case "solvePercentage":
          return direction * (a.solvePercentage - b.solvePercentage);
        default:
          return 0;
      }
    });
  }, [analytics, sortConfig]);

  if (isLoadingAnalytics || isLoadingStats) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-muted-foreground">Lade Statistiken...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <Select
            value={timeSpan}
            onValueChange={(value) => setTimeSpan(value as TimeSpan)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Zeitraum wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">vs. letzte Stunde</SelectItem>
              <SelectItem value="24h">vs. letzte 24 Stunden</SelectItem>
              <SelectItem value="7d">vs. letzte 7 Tage</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Benutzer"
            value={stats?.totalUsers ?? 0}
            change={stats?.changes.users ?? 0}
            icon={Users}
          />
          <StatCard
            title="Punchlines"
            value={stats?.totalPunchlines ?? 0}
            change={stats?.changes.punchlines ?? 0}
            icon={(props) => (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                {...props}
              >
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" />
              </svg>
            )}
          />
          <StatCard
            title="Gelöste Punchlines"
            value={stats?.totalSolves ?? 0}
            change={stats?.changes.solves ?? 0}
            icon={(props) => (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                {...props}
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <path d="M22 4 12 14.01l-3-3" />
              </svg>
            )}
          />
          <StatCard
            title="Durchschnitt pro Benutzer"
            value={Number((stats?.averageSolvesPerUser ?? 0).toFixed(1))}
            change={stats?.changes.average ?? 0}
            icon={(props) => (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                {...props}
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            )}
          />
        </div>

        <div className="m grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Punchline Statistiken</CardTitle>
              <CardDescription>
                Detaillierte Statistiken zu allen Punchlines und deren Lösungen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className={cn(
                          "cursor-pointer select-none",
                          sortConfig.key === "line" && "text-primary",
                        )}
                        onClick={() => handleSort("line")}
                      >
                        Punchline
                      </TableHead>
                      <TableHead
                        className={cn(
                          "cursor-pointer select-none",
                          sortConfig.key === "song" && "text-primary",
                        )}
                        onClick={() => handleSort("song")}
                      >
                        Song
                      </TableHead>
                      <TableHead
                        className={cn(
                          "cursor-pointer select-none text-center",
                          sortConfig.key === "totalSolves" && "text-primary",
                        )}
                        onClick={() => handleSort("totalSolves")}
                      >
                        Gelöst
                      </TableHead>
                      <TableHead
                        className={cn(
                          "cursor-pointer select-none",
                          sortConfig.key === "solvePercentage" &&
                            "text-primary",
                        )}
                        onClick={() => handleSort("solvePercentage")}
                      >
                        Quote
                      </TableHead>
                      <TableHead className="text-center">
                        Falsche Antworten
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAnalytics.map((punchline) => (
                      <React.Fragment key={punchline.id}>
                        <TableRow>
                          <TableCell className="font-medium">
                            {punchline.line}
                          </TableCell>
                          <TableCell>
                            {punchline.song.artist} - {punchline.song.name}
                          </TableCell>
                          <TableCell className="text-center">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="link" className="gap-2">
                                  <span>{punchline.totalSolves}</span>
                                  <Users className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[625px]">
                                <DialogHeader>
                                  <DialogTitle>Punchline Details</DialogTitle>
                                  <DialogDescription>
                                    {punchline.line}
                                    <div className="mt-2 text-sm">
                                      {punchline.song.artist} -{" "}
                                      {punchline.song.name}
                                    </div>
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="mt-4">
                                  <div className="mb-4 flex items-center justify-between">
                                    <h4 className="font-medium">
                                      Gelöst von {punchline.totalSolves}{" "}
                                      Benutzern
                                    </h4>
                                    <div className="flex items-center gap-2">
                                      <Progress
                                        value={punchline.solvePercentage}
                                        className="w-[60px]"
                                      />
                                      <span className="text-sm text-muted-foreground">
                                        {punchline.solvePercentage.toFixed(1)}%
                                      </span>
                                    </div>
                                  </div>
                                  <div className="space-y-4">
                                    {punchline.solvedBy.map((user) => (
                                      <div
                                        key={`${punchline.id}-${user.id}`}
                                        className="flex items-center gap-3 rounded-lg border p-3"
                                      >
                                        <div className="relative">
                                          <Avatar
                                            className={cn(
                                              "ring-2 ring-offset-2",
                                              user.isAdmin
                                                ? "ring-primary"
                                                : "ring-transparent",
                                            )}
                                          >
                                            <AvatarImage
                                              src={user.image ?? undefined}
                                            />
                                            <AvatarFallback>
                                              {user.name
                                                ?.slice(0, 2)
                                                .toUpperCase() ??
                                                user.email
                                                  .slice(0, 2)
                                                  .toUpperCase()}
                                            </AvatarFallback>
                                          </Avatar>
                                          {user.isAdmin && (
                                            <TooltipProvider>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <div className="absolute -right-1 -top-1 rounded-full bg-background p-0.5">
                                                    <ShieldCheck className="h-3 w-3 text-primary" />
                                                  </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  <p>Admin</p>
                                                </TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                          )}
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="font-medium">
                                            {user.name ?? user.email}
                                          </span>
                                          <span className="text-sm text-muted-foreground">
                                            Gelöst am{" "}
                                            {user.solvedAt.toLocaleDateString()}
                                          </span>
                                          <span className="text-sm text-muted-foreground">
                                            Lösung: &quot;{user.solution}&quot;
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={punchline.solvePercentage}
                                className="w-[60px]"
                              />
                              <span className="text-sm text-muted-foreground">
                                {punchline.solvePercentage.toFixed(1)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flex items-center gap-1.5"
                                >
                                  {punchline.wrongGuesses.length}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                align="end"
                                className="w-96 p-0"
                                sideOffset={5}
                              >
                                <div className="px-4 py-3">
                                  <h4 className="mb-2 font-medium leading-none">
                                    Falsche Antworten
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {punchline.wrongGuesses.length} verschiedene
                                    falsche Antworten
                                  </p>
                                </div>
                                <ScrollArea className="h-72">
                                  <div className="p-4 pt-0">
                                    <div className="space-y-4">
                                      {punchline.wrongGuesses.map(
                                        (guess, index) => (
                                          <div
                                            key={index}
                                            className="flex items-center justify-between gap-4"
                                          >
                                            <div className="flex-1 space-y-1">
                                              <p className="text-sm font-medium leading-none">
                                                {guess.guess}
                                              </p>
                                              <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(
                                                  guess.timestamp,
                                                  {
                                                    addSuffix: true,
                                                    locale: de,
                                                  },
                                                )}
                                              </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <p className="text-sm text-muted-foreground">
                                                {guess.count}×
                                              </p>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() =>
                                                  setEditPunchlineId(
                                                    punchline.id,
                                                  )
                                                }
                                              >
                                                <Edit2 className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                onClick={async (e) => {
                                                  e.stopPropagation();
                                                  try {
                                                    await deleteWrongGuess(
                                                      punchline.id,
                                                      guess.guess,
                                                    );
                                                    queryClient.invalidateQueries(
                                                      {
                                                        queryKey: [
                                                          "punchlineAnalytics",
                                                        ],
                                                      },
                                                    );
                                                    toast({
                                                      title: "Erfolgreich",
                                                      description:
                                                        "Falsche Antwort wurde gelöscht.",
                                                    });
                                                  } catch (error) {
                                                    toast({
                                                      variant: "destructive",
                                                      title: "Fehler",
                                                      description:
                                                        "Fehler beim Löschen der falschen Antwort.",
                                                    });
                                                  }
                                                }}
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                </ScrollArea>
                              </PopoverContent>
                            </Popover>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <EditPunchlineDialog
        open={editPunchlineId !== null}
        onOpenChange={(open) => !open && setEditPunchlineId(null)}
        punchlineId={editPunchlineId}
      />
    </>
  );
}
