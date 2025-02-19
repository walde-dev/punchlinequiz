import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  type PunchlineAnalytics,
  deleteWrongGuess,
} from "~/app/actions/analytics";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { Edit2, Users2, Trash2, ArrowUpDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { ScrollArea } from "~/components/ui/scroll-area";
import { cn } from "~/lib/utils";
import { useState } from "react";
import EditPunchlineDialog from "./edit-punchline-dialog";
import { useToast } from "~/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";

type SortField = "line" | "totalSolves" | "solvePercentage" | "wrongGuesses";
type SortDirection = "asc" | "desc";

export default function PunchlineTable({
  punchlines,
}: {
  punchlines: PunchlineAnalytics[];
}) {
  const [editPunchlineId, setEditPunchlineId] = useState<number | null>(null);
  const [sortField, setSortField] = useState<SortField>("totalSolves");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedPunchlines = [...punchlines].sort((a, b) => {
    const direction = sortDirection === "asc" ? 1 : -1;
    switch (sortField) {
      case "line":
        return direction * a.line.localeCompare(b.line);
      case "totalSolves":
        return direction * (a.totalSolves - b.totalSolves);
      case "solvePercentage":
        return direction * (a.solvePercentage - b.solvePercentage);
      case "wrongGuesses":
        return direction * (a.wrongGuesses.length - b.wrongGuesses.length);
      default:
        return 0;
    }
  });

  const handleDeleteWrongGuess = async (punchlineId: number, guess: string) => {
    try {
      await deleteWrongGuess(punchlineId, guess);
      queryClient.invalidateQueries({ queryKey: ["punchlineAnalytics"] });
      toast({
        title: "Erfolgreich",
        description: "Falsche Antwort wurde gelöscht.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Falsche Antwort konnte nicht gelöscht werden.",
      });
    }
  };

  return (
    <div className="rounded-md border">
      <div
        className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary hover:scrollbar-thumb-primary/80 scrollbar-always max-h-[60vh] overflow-y-auto"
        style={{
          scrollbarGutter: "stable",
        }}
      >
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("line")}
                  className="flex items-center gap-2 font-bold hover:text-primary"
                >
                  Punchline
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("totalSolves")}
                  className="flex items-center gap-2 font-bold hover:text-primary"
                >
                  Gelöst
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("solvePercentage")}
                  className="flex items-center gap-2 font-bold hover:text-primary"
                >
                  Quote
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("wrongGuesses")}
                  className="flex items-center gap-2 font-bold hover:text-primary"
                >
                  Falsche Antworten
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="w-[100px]">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPunchlines.map((punchline) => (
              <TableRow key={punchline.id}>
                <TableCell className="max-w-[300px] truncate font-medium">
                  {punchline.line}
                </TableCell>
                <TableCell>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1.5"
                      >
                        <Users2 className="h-4 w-4" />
                        {punchline.totalSolves}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      className="w-80 p-0"
                      sideOffset={5}
                    >
                      <div className="px-4 py-3">
                        <h4 className="mb-2 font-medium leading-none">
                          Gelöst von
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {punchline.solvedBy.length} Nutzer haben diese Punchline
                          gelöst
                        </p>
                      </div>
                      <ScrollArea className="h-72">
                        <div className="p-4 pt-0">
                          <div className="space-y-4">
                            {punchline.solvedBy.map((user) => (
                              <div
                                key={user.id}
                                className="flex items-center gap-4"
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={user.image ?? undefined} />
                                  <AvatarFallback>
                                    {user.name?.[0] ?? user.email[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1">
                                  <p className="text-sm font-medium leading-none">
                                    {user.name ?? user.email}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(user.solvedAt, {
                                      addSuffix: true,
                                      locale: de,
                                    })}
                                  </p>
                                </div>
                                <p
                                  className={cn(
                                    "text-xs",
                                    user.solution === punchline.line
                                      ? "text-green-500"
                                      : "text-yellow-500",
                                  )}
                                >
                                  {user.solution}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                </TableCell>
                <TableCell>{punchline.solvePercentage.toFixed(1)}%</TableCell>
                <TableCell>
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
                      align="start"
                      className="w-96 p-0"
                      sideOffset={5}
                    >
                      <div className="px-4 py-3">
                        <h4 className="mb-2 font-medium leading-none">
                          Falsche Antworten
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {punchline.wrongGuesses.length} verschiedene falsche
                          Antworten
                        </p>
                      </div>
                      <ScrollArea className="h-72">
                        <div className="p-4 pt-0">
                          <div className="space-y-4">
                            {punchline.wrongGuesses.map((guess, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between gap-4"
                              >
                                <div className="flex-1 space-y-1">
                                  <p className="text-sm font-medium leading-none">
                                    {guess.guess}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(guess.timestamp, {
                                      addSuffix: true,
                                      locale: de,
                                    })}
                                  </p>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-sm text-muted-foreground">
                                    {guess.count}x
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      handleDeleteWrongGuess(
                                        punchline.id,
                                        guess.guess,
                                      )
                                    }
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditPunchlineId(punchline.id)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <EditPunchlineDialog
        open={editPunchlineId !== null}
        onOpenChange={(open) => !open && setEditPunchlineId(null)}
        punchlineId={editPunchlineId}
      />
    </div>
  );
}
