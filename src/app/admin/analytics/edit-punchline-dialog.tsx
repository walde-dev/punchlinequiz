import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import PunchlineForm from "../punchline-form";
import { usePunchlines } from "~/app/hooks/usePunchlines";

interface EditPunchlineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  punchlineId: number | null;
}

export default function EditPunchlineDialog({
  open,
  onOpenChange,
  punchlineId,
}: EditPunchlineDialogProps) {
  const { data: punchlines } = usePunchlines();
  const punchline = punchlines?.find((p) => p.id === punchlineId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Punchline bearbeiten</DialogTitle>
        </DialogHeader>
        {punchline && (
          <PunchlineForm
            onSuccess={() => onOpenChange(false)}
            initialData={{
              ...punchline,
              acceptableSolutions: Array.isArray(punchline.acceptableSolutions)
                ? punchline.acceptableSolutions
                : JSON.parse(punchline.acceptableSolutions),
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
} 