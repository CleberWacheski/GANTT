import { cn } from '@renderer/lib/utils'
import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
  type FC
} from 'react'
import { createPortal } from 'react-dom'

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
      <div>{children}</div>
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
  const { open, setOpen, triggerRef } = useContext(DropdownContext)
  const ref = useRef<HTMLDivElement>(null)

  const positionRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return
      ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
      const trigger = triggerRef.current
      if (!trigger) return
      const rect = trigger.getBoundingClientRect()
      const menuRect = node.getBoundingClientRect()
      let top = rect.bottom + 4
      let left = align === 'end' ? rect.right - menuRect.width : rect.left

      if (top + menuRect.height > window.innerHeight) {
        top = rect.top - menuRect.height - 4
      }
      if (left < 8) left = 8
      if (left + menuRect.width > window.innerWidth - 8) {
        left = window.innerWidth - menuRect.width - 8
      }

      node.style.top = `${top}px`
      node.style.left = `${left}px`
    },
    [align, triggerRef]
  )

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

  return createPortal(
    <div
      ref={positionRef}
      style={{ position: 'fixed', top: 0, left: 0 }}
      className={cn(
        'z-[100] min-w-[160px] rounded-lg border border-slate-200 bg-white p-1 shadow-lg',
        className
      )}
    >
      {children}
    </div>,
    document.body
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
