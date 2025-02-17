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
import { Edit2, Users2, Trash2 } from "lucide-react";
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

export default function PunchlineTable({
  punchlines,
}: {
  punchlines: PunchlineAnalytics[];
}) {
  const [editPunchlineId, setEditPunchlineId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Punchline</TableHead>
            <TableHead className="w-[100px] text-right">Gelöst</TableHead>
            <TableHead className="w-[100px] text-right">Quote</TableHead>
            <TableHead className="w-[100px] text-right">
              Falsche Antworten
            </TableHead>
            <TableHead className="w-[100px] text-right">Bearbeiten</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {punchlines.map((punchline) => (
            <TableRow key={punchline.id}>
              <TableCell className="font-medium">{punchline.line}</TableCell>
              <TableCell className="text-right">
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
                    align="end"
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
              <TableCell className="text-right">
                {punchline.solvePercentage.toFixed(1)}%
              </TableCell>
              <TableCell className="text-right">
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
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-muted-foreground">
                                  {guess.count}×
                                </p>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditPunchlineId(punchline.id);
                                  }}
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
                                      queryClient.invalidateQueries({
                                        queryKey: ["punchlineAnalytics"],
                                      });
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
                          ))}
                        </div>
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              </TableCell>
              <TableCell className="text-right">
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
      <EditPunchlineDialog
        open={editPunchlineId !== null}
        onOpenChange={(open) => !open && setEditPunchlineId(null)}
        punchlineId={editPunchlineId}
      />
    </>
  );
}
