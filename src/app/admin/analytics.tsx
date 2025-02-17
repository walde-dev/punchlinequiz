"use client";

import { usePunchlineAnalytics, useOverallStats } from "../hooks/useAnalytics";
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
import { Button } from "~/components/ui/button";
import { Users, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Progress } from "~/components/ui/progress";
import { useState } from "react";
import { cn } from "~/lib/utils";
import React from "react";

export default function Analytics() {
  const { data: analytics, isLoading: isLoadingAnalytics } =
    usePunchlineAnalytics();
  const { data: stats, isLoading: isLoadingStats } = useOverallStats();
  const [expandedPunchlines, setExpandedPunchlines] = useState<number[]>([]);

  const toggleExpand = (id: number) => {
    setExpandedPunchlines((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  if (isLoadingAnalytics || isLoadingStats) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-muted-foreground">Lade Statistiken...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Benutzer</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Punchlines</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPunchlines}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gelöste Punchlines
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="M22 4 12 14.01l-3-3" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSolves}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Durchschnitt pro Benutzer
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.averageSolvesPerUser.toFixed(1)}
            </div>
          </CardContent>
        </Card>
      </div>

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
                  <TableHead className="w-auto">Punchline</TableHead>
                  <TableHead className="w-[200px]">Song</TableHead>
                  <TableHead className="w-[120px] text-center">
                    Gelöst von
                  </TableHead>
                  <TableHead className="w-[200px]">Fortschritt</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics?.map((punchline) => (
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
                                  Gelöst von {punchline.totalSolves} Benutzern
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
                      <TableCell></TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
