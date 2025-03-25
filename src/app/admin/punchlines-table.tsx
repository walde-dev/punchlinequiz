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
} from "~/components/ui/dialog";
import PunchlineForm from "./punchline-form";
import { usePunchlines, useDeletePunchline } from "../hooks/usePunchlines";
import { usePunchlineAnalytics } from "../hooks/useAnalytics";
import { type Punchline } from "../actions/punchlines";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";
import { useToast } from "~/components/ui/use-toast";
import PunchlineTable from "./analytics/punchline-table";

export default function PunchlinesTable() {
  const [open, setOpen] = useState(false);
  const [editPunchline, setEditPunchline] = useState<Punchline | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [punchlineToDelete, setPunchlineToDelete] = useState<number | null>(
    null,
  );
  const { data: punchlines, isLoading, error } = usePunchlines();
  const { data: punchlineAnalytics, isLoading: isLoadingAnalytics } = usePunchlineAnalytics();
  const deleteMutation = useDeletePunchline();
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!punchlineToDelete) return;

    try {
      await deleteMutation.mutateAsync(punchlineToDelete);
      toast({
        title: "Erfolgreich",
        description: "Punchline wurde erfolgreich gelöscht!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Punchline konnte nicht gelöscht werden.",
      });
    } finally {
      setDeleteConfirmOpen(false);
      setPunchlineToDelete(null);
    }
  };

  if (isLoading || isLoadingAnalytics) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-muted-foreground">Lade Punchlines...</p>
      </div>
    );
  }

  if (error instanceof Error) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-destructive">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Punchlines</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="mr-2 h-4 w-4" />
                Neue Punchline
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editPunchline
                    ? "Punchline bearbeiten"
                    : "Neue Punchline hinzufügen"}
                </DialogTitle>
              </DialogHeader>
              <PunchlineForm
                onSuccess={() => {
                  setOpen(false);
                  setEditPunchline(null);
                }}
                initialData={
                  !!editPunchline
                    ? {
                        ...editPunchline,
                        acceptableSolutions: Array.isArray(
                          editPunchline.acceptableSolutions,
                        )
                          ? editPunchline.acceptableSolutions
                          : JSON.parse(editPunchline.acceptableSolutions),
                      }
                    : undefined
                }
              />
            </DialogContent>
          </Dialog>
        </div>

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
                  <TableHead>Punchline</TableHead>
                  <TableHead>Künstler</TableHead>
                  <TableHead>Song</TableHead>
                  <TableHead>Album</TableHead>
                  <TableHead>Lösung</TableHead>
                  <TableHead className="w-[100px]">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {punchlines?.map((punchline: Punchline) => (
                  <TableRow key={punchline.id}>
                    <TableCell className="font-medium">
                      {punchline.line}
                    </TableCell>
                    <TableCell>{punchline.song.artist.name}</TableCell>
                    <TableCell>{punchline.song.name}</TableCell>
                    <TableCell>{punchline.song.album.name}</TableCell>
                    <TableCell>{punchline.perfectSolution}</TableCell>
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
                            setPunchlineToDelete(punchline.id);
                            setDeleteConfirmOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!punchlines || punchlines.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Keine Punchlines gefunden
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {punchlineAnalytics && (
        <div>
          <h2 className="mb-4 text-2xl font-bold">Punchline Statistiken</h2>
          <PunchlineTable punchlines={punchlineAnalytics} />
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Punchline löschen"
        description="Bist du sicher, dass du diese Punchline löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden."
        onConfirm={handleDelete}
        variant="destructive"
        confirmText="Löschen"
      />
    </div>
  );
}
