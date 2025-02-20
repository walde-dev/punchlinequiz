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
import { useState, useEffect } from "react";
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
import {
  Tabs,
  TabsList,
  TabsContent,
  TabsTrigger,
} from "~/components/ui/tabs";

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

function getActivityText(type: string): string {
  switch (type) {
    case "play":
      return "hat eine Runde gespielt";
    case "correct_guess":
      return "hat eine richtige Antwort gegeben";
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
    default:
      return "hat eine Aktion ausgeführt";
  }
}

function AnonymousUsersCard() {
  const [timeSpan, setTimeSpan] = useState<TimeSpan>("24h");
  const { data: stats, isLoading } = useAnonymousStats(timeSpan);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  useEffect(() => {
    // When data changes, only expand the most recent session
    if (stats?.recentActivity?.[0]?.id) {
      setExpandedSessions(new Set([stats.recentActivity[0].id]));
    }
  }, [stats]);

  const toggleSession = (sessionId: string) => {
    setExpandedSessions(prev => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  };

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
              {stats.recentActivity
                .filter(session => !session.convertedToUser)
                .map((session) => (
                <div key={session.id} className="rounded-lg border p-4">
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-0 hover:bg-transparent"
                    onClick={() => toggleSession(session.id)}
                  >
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
                          ? ((session.correctGuesses / session.totalPlays) * 100).toFixed(1)
                          : "0"}% Erfolgsquote
                      </p>
                    </div>
                  </Button>
                  {expandedSessions.has(session.id) && session.activities.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {[...session.activities]
                        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                        .map((activity, index) => (
                          <div
                            key={index}
                            className="flex flex-col space-y-1 rounded-lg border p-3 text-sm"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                Anonymer Benutzer {getActivityText(activity.type)}
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
                              <div className={cn(
                                "text-sm",
                                activity.type === "correct_guess" ? "text-green-600" : "text-red-600"
                              )}>
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
                .filter(session => session.convertedToUser)
                .map((session) => (
                <div key={session.id} className="rounded-lg border p-4">
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-0 hover:bg-transparent"
                    onClick={() => toggleSession(session.id)}
                  >
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
                        {session.correctGuesses} / {session.totalPlays} richtig
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.totalPlays > 0
                          ? ((session.correctGuesses / session.totalPlays) * 100).toFixed(1)
                          : "0"}% Erfolgsquote
                      </p>
                    </div>
                  </Button>
                  {expandedSessions.has(session.id) && session.activities.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {[...session.activities]
                        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                        .map((activity, index) => (
                          <div
                            key={index}
                            className="flex flex-col space-y-1 rounded-lg border p-3 text-sm"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                {session.user?.name || "Benutzer"} {getActivityText(activity.type)}
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
                              <div className={cn(
                                "text-sm",
                                activity.type === "correct_guess" ? "text-green-600" : "text-red-600"
                              )}>
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

export default function Analytics() {
  const queryClient = useQueryClient();
  const [timeSpan, setTimeSpan] = useState<TimeSpan>("24h");
  const { data: stats, isLoading: isLoadingStats } = useOverallStats(timeSpan);

  if (isLoadingStats) {
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

        <div className="grid gap-4 md:grid-cols-2">
          <StatCard
            title="Registrierte Benutzer"
            value={stats?.totalUsers ?? 0}
            change={stats?.changes.users ?? 0}
            icon={Users}
          />
          <StatCard
            title="Aktive Sessions"
            value={stats?.activeSessions ?? 0}
            change={stats?.changes.activeSessions ?? 0}
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
        </div>

        <AnonymousUsersCard />
      </div>
    </>
  );
}
