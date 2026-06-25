import * as React from "react"
import { Button } from "@/components/ui/button"

export interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  cancelText?: string
  actionText?: string
  onAction: () => void
  onCancel?: () => void
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  cancelText = "Cancel",
  actionText = "Continue",
  onAction,
  onCancel,
}: AlertDialogProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-outline-variant max-w-md w-full rounded-2xl shadow-xl p-6 relative animate-in zoom-in-95 duration-200">
        <h2 className="text-lg font-bold text-on-surface mb-2">{title}</h2>
        <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">{description}</p>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              if (onCancel) onCancel()
            }}
            className="rounded-xl border-outline-variant hover:bg-surface-container-lowest"
          >
            {cancelText}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onOpenChange(false)
              onAction()
            }}
            className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
          >
            {actionText}
          </Button>
        </div>
      </div>
    </div>
  )
}
