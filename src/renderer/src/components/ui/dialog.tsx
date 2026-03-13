import { cn } from '@renderer/lib/utils'
import { X } from 'lucide-react'
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
  type FC
} from 'react'

interface DialogContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const DialogContext = createContext<DialogContextValue>({ open: false, setOpen: () => {} })

export function Dialog({
  open: controlledOpen,
  onOpenChange,
  children
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: ReactNode
}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = useCallback(
    (v: boolean) => {
      onOpenChange?.(v)
      setInternalOpen(v)
    },
    [onOpenChange]
  )
  return <DialogContext.Provider value={{ open, setOpen }}>{children}</DialogContext.Provider>
}

export function DialogTrigger({ children, asChild }: { children: ReactNode; asChild?: boolean }) {
  const { setOpen } = useContext(DialogContext)
  if (asChild) {
    return <span onClick={() => setOpen(true)}>{children}</span>
  }
  return <button onClick={() => setOpen(true)}>{children}</button>
}

export const DialogContent: FC<{ children: ReactNode; className?: string }> = ({
  children,
  className
}) => {
  const { open, setOpen } = useContext(DialogContext)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open, setOpen])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div
        className={cn(
          'relative z-50 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl animate-in fade-in-0 zoom-in-95',
          className
        )}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 rounded-md p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  )
}

export const DialogHeader: FC<{ children: ReactNode; className?: string }> = ({
  children,
  className
}) => <div className={cn('mb-4 space-y-1.5', className)}>{children}</div>

export const DialogTitle: FC<{ children: ReactNode; className?: string }> = ({
  children,
  className
}) => <h2 className={cn('text-lg font-semibold text-slate-900', className)}>{children}</h2>

export const DialogDescription: FC<{ children: ReactNode; className?: string }> = ({
  children,
  className
}) => <p className={cn('text-sm text-slate-500', className)}>{children}</p>

export const DialogFooter: FC<{ children: ReactNode; className?: string }> = ({
  children,
  className
}) => <div className={cn('mt-6 flex justify-end gap-2', className)}>{children}</div>

export function DialogClose({ children }: { children: ReactNode }) {
  const { setOpen } = useContext(DialogContext)
  return <span onClick={() => setOpen(false)}>{children}</span>
}
