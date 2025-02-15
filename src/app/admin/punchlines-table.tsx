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
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import PunchlineForm from "./punchline-form";
import { usePunchlines } from "../hooks/usePunchlines";
import { type Punchline } from "../actions/punchlines";

export default function PunchlinesTable() {
  const [open, setOpen] = useState(false);
  const { data: punchlines, isLoading, error } = usePunchlines();

  if (isLoading) {
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
              <DialogTitle>Neue Punchline hinzufügen</DialogTitle>
            </DialogHeader>
            <PunchlineForm onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Punchline</TableHead>
              <TableHead>Künstler</TableHead>
              <TableHead>Song</TableHead>
              <TableHead>Album</TableHead>
              <TableHead>Lösung</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {punchlines?.map((punchline: Punchline) => (
              <TableRow key={punchline.id}>
                <TableCell className="font-medium">{punchline.line}</TableCell>
                <TableCell>{punchline.song.artist.name}</TableCell>
                <TableCell>{punchline.song.name}</TableCell>
                <TableCell>{punchline.song.album.name}</TableCell>
                <TableCell>{punchline.perfectSolution}</TableCell>
              </TableRow>
            ))}
            {(!punchlines || punchlines.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Keine Punchlines gefunden
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 