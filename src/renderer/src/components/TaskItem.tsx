import { Button } from '@renderer/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { cn } from '@renderer/lib/utils'
import type { Task } from '../../../preload/index.d'
import { Calendar, GripVertical, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { FC } from 'react'

interface TaskItemProps {
  task: Task
  color: string
  onEdit: (task: Task) => void
  onDelete: (taskId: number) => void
  isDragging?: boolean
  isDragOver?: boolean
  dragPosition?: 'above' | 'below' | null
  onDragStart: (e: React.DragEvent, task: Task) => void
  onDragOver: (e: React.DragEvent, task: Task) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent, task: Task) => void
  onDragEnd: () => void
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function daysRemaining(endDate: string) {
  const end = new Date(endDate + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

export const TaskItem: FC<TaskItemProps> = ({
  task,
  color,
  onEdit,
  onDelete,
  isDragging,
  dragPosition,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd
}) => {
  const remaining = daysRemaining(task.endDate)

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragOver={(e) => onDragOver(e, task)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, task)}
      onDragEnd={onDragEnd}
      className={cn(
        'group relative flex items-center gap-2 rounded-lg border bg-white px-3 py-2.5 transition-all',
        isDragging
          ? 'opacity-40 border-blue-300 bg-blue-50/50 shadow-none'
          : 'border-slate-100 hover:border-slate-200 hover:shadow-sm',
        dragPosition === 'above' && 'border-t-blue-500 border-t-2',
        dragPosition === 'below' && 'border-b-blue-500 border-b-2'
      )}
    >
      {/* Drag handle */}
      <div className="shrink-0 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-400 transition-colors opacity-0 group-hover:opacity-100">
        <GripVertical className="h-4 w-4" />
      </div>

      <div className="h-8 w-1 rounded-full shrink-0" style={{ backgroundColor: color }} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-800 truncate">{task.name}</span>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Calendar className="h-3 w-3" />
            <span>
              {formatDate(task.startDate)} — {formatDate(task.endDate)}
            </span>
          </div>
          {remaining >= 0 && remaining <= 3 && (
            <span className="text-xs text-amber-500 font-medium">
              {remaining === 0 ? 'Vence hoje' : `${remaining}d restantes`}
            </span>
          )}
          {remaining < 0 && <span className="text-xs text-red-500 font-medium">Atrasada</span>}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(task)}>
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onClick={() => onDelete(task.id)}>
            <Trash2 className="h-3.5 w-3.5" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
