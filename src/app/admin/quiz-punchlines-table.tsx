"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { PlusIcon, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import { useToast } from "~/components/ui/use-toast";
import QuizPunchlineForm from "./quiz-punchline-form";
import { useQuizPunchlines, useDeleteQuizPunchline } from "~/app/hooks/useQuiz";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import type { QuizPunchline } from "~/app/actions/quiz";

export default function QuizPunchlinesTable() {
  const [open, setOpen] = useState(false);
  const [editPunchline, setEditPunchline] = useState<QuizPunchline | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [punchlineToDelete, setPunchlineToDelete] = useState<QuizPunchline | null>(null);
  const { toast } = useToast();
  const { data, isLoading } = useQuizPunchlines();
  const deleteQuizPunchline = useDeleteQuizPunchline();
  const punchlines = data as QuizPunchline[] ?? [];

  const handleDelete = async (punchline: QuizPunchline) => {
    try {
      await deleteQuizPunchline.mutateAsync(punchline.id);
      toast({
        title: "Erfolgreich",
        description: "Quiz Punchline wurde erfolgreich gelöscht!",
      });
      setDeleteConfirmOpen(false);
      setPunchlineToDelete(null);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Quiz Punchline konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-muted-foreground">Lade Quiz Punchlines...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quiz Punchlines</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Neue Quiz Punchline
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editPunchline ? "Quiz Punchline bearbeiten" : "Neue Quiz Punchline hinzufügen"}
              </DialogTitle>
            </DialogHeader>
            <QuizPunchlineForm
              punchline={editPunchline}
              onSuccess={() => {
                setOpen(false);
                setEditPunchline(null);
                toast({
                  title: "Erfolgreich",
                  description: editPunchline
                    ? "Quiz Punchline wurde erfolgreich bearbeitet!"
                    : "Quiz Punchline wurde erfolgreich erstellt!",
                });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quiz Punchline löschen</DialogTitle>
            <DialogDescription>
              Bist du sicher, dass du diese Quiz Punchline löschen möchtest?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setPunchlineToDelete(null);
              }}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={() => punchlineToDelete && handleDelete(punchlineToDelete)}
              disabled={deleteQuizPunchline.isPending}
            >
              {deleteQuizPunchline.isPending ? "Wird gelöscht..." : "Löschen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[400px]">Punchline</TableHead>
              <TableHead>Song</TableHead>
              <TableHead>Korrekter Künstler</TableHead>
              <TableHead>Falsche Künstler</TableHead>
              <TableHead className="w-[100px]">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {punchlines.length > 0 ? (
              punchlines.map((punchline) => (
                <TableRow key={punchline.id}>
                  <TableCell className="font-medium">
                    {punchline.line}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {punchline.song.album.image && (
                        <img
                          src={punchline.song.album.image}
                          alt={punchline.song.album.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium">{punchline.song.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {punchline.song.artist.name} • {punchline.song.album.name}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={punchline.correctArtist.image ?? undefined} />
                        <AvatarFallback>
                          {punchline.correctArtist.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{punchline.correctArtist.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      {punchline.wrongArtists.map((artist) => (
                        <div key={artist.id} className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={artist.image ?? undefined} />
                            <AvatarFallback>
                              {artist.name.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{artist.name}</span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setEditPunchline(punchline);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setPunchlineToDelete(punchline);
                          setDeleteConfirmOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Keine Quiz Punchlines gefunden
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
