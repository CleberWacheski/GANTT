import { cn } from '@renderer/lib/utils'
import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  type ReactNode,
  type FC
} from 'react'

interface DropdownContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLDivElement | null>
}

const DropdownContext = createContext<DropdownContextValue>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null }
})

export function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  return (
    <DropdownContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative">{children}</div>
    </DropdownContext.Provider>
  )
}

export function DropdownMenuTrigger({
  children,
  asChild
}: {
  children: ReactNode
  asChild?: boolean
}) {
  const { open, setOpen, triggerRef } = useContext(DropdownContext)
  return (
    <div
      ref={triggerRef}
      onClick={(e) => {
        e.stopPropagation()
        setOpen(!open)
      }}
      className={asChild ? '' : 'cursor-pointer'}
    >
      {children}
    </div>
  )
}

export const DropdownMenuContent: FC<{
  children: ReactNode
  className?: string
  align?: 'start' | 'end'
}> = ({ children, className, align = 'end' }) => {
  const { open, setOpen } = useContext(DropdownContext)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, setOpen])

  if (!open) return null

  return (
    <div
      ref={ref}
      className={cn(
        'absolute z-50 mt-1 min-w-[160px] rounded-lg border border-slate-200 bg-white p-1 shadow-lg',
        align === 'end' ? 'right-0' : 'left-0',
        className
      )}
    >
      {children}
    </div>
  )
}

export const DropdownMenuItem: FC<{
  children: ReactNode
  className?: string
  onClick?: () => void
  destructive?: boolean
}> = ({ children, className, onClick, destructive }) => {
  const { setOpen } = useContext(DropdownContext)
  return (
    <button
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors cursor-pointer',
        destructive ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-100',
        className
      )}
      onClick={() => {
        onClick?.()
        setOpen(false)
      }}
    >
      {children}
    </button>
  )
}

export const DropdownMenuSeparator: FC = () => <div className="my-1 h-px bg-slate-100" />
