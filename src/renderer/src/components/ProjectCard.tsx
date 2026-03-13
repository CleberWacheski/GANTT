import { Button } from '@renderer/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import type { Project, Task } from '../../../preload/index.d'
import { TaskItem } from './TaskItem'
import { FolderOpen, MoreHorizontal, Paperclip, Pencil, Plus, Trash2 } from 'lucide-react'
import { useCallback, useState, type FC } from 'react'

interface ProjectCardProps {
  project: Project
  tasks: Task[]
  onEditProject: (project: Project) => void
  onDeleteProject: (projectId: number) => void
  onCreateTask: (projectId: number) => void
  onEditTask: (task: Task) => void
  onDeleteTask: (taskId: number) => void
  onReorderTasks: (projectId: number, orderedIds: number[]) => void
  onOpenFiles: (projectId: number) => void
  fileCount: number
}

export const ProjectCard: FC<ProjectCardProps> = ({
  project,
  tasks,
  onEditProject,
  onDeleteProject,
  onCreateTask,
  onEditTask,
  onDeleteTask,
  onReorderTasks,
  onOpenFiles,
  fileCount
}) => {
  const totalTasks = tasks.length
  const sorted = [...tasks].sort((a, b) => a.sortOrder - b.sortOrder)

  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [dragOverId, setDragOverId] = useState<number | null>(null)
  const [dragPosition, setDragPosition] = useState<'above' | 'below' | null>(null)

  const handleDragStart = useCallback((e: React.DragEvent, task: Task) => {
    setDraggingId(task.id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(task.id))
  }, [])

  const handleDragOver = useCallback(
    (e: React.DragEvent, task: Task) => {
      e.preventDefault()
      if (task.id === draggingId) return
      e.dataTransfer.dropEffect = 'move'

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const midY = rect.top + rect.height / 2
      const pos = e.clientY < midY ? 'above' : 'below'

      setDragOverId(task.id)
      setDragPosition(pos)
    },
    [draggingId]
  )

  const handleDragLeave = useCallback(() => {
    setDragOverId(null)
    setDragPosition(null)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, targetTask: Task) => {
      e.preventDefault()
      if (draggingId === null || draggingId === targetTask.id) return

      const currentOrder = sorted.map((t) => t.id)
      const fromIndex = currentOrder.indexOf(draggingId)
      if (fromIndex === -1) return

      // Remove dragged item
      currentOrder.splice(fromIndex, 1)

      // Find target position
      let toIndex = currentOrder.indexOf(targetTask.id)
      if (dragPosition === 'below') toIndex += 1

      // Insert at new position
      currentOrder.splice(toIndex, 0, draggingId)

      onReorderTasks(project.id, currentOrder)

      setDraggingId(null)
      setDragOverId(null)
      setDragPosition(null)
    },
    [draggingId, dragPosition, sorted, project.id, onReorderTasks]
  )

  const handleDragEnd = useCallback(() => {
    setDraggingId(null)
    setDragOverId(null)
    setDragPosition(null)
  }, [])

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-white">
        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-800 truncate">{project.name}</h3>
          {project.description && (
            <p className="text-xs text-slate-400 truncate mt-0.5">{project.description}</p>
          )}
        </div>
        {totalTasks > 0 && (
          <span className="text-xs text-slate-400 shrink-0">
            {totalTasks} {totalTasks === 1 ? 'tarefa' : 'tarefas'}
          </span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEditProject(project)}>
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onClick={() => onDeleteProject(project.id)}>
              <Trash2 className="h-3.5 w-3.5" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tasks */}
      <div className="flex-1 p-3 space-y-2">
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-slate-300">
            <FolderOpen className="h-8 w-8 mb-2" />
            <span className="text-xs">Nenhuma tarefa</span>
          </div>
        )}
        {sorted.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            color={project.color}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            isDragging={draggingId === task.id}
            dragPosition={dragOverId === task.id ? dragPosition : null}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-1 px-3 pb-3">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 justify-start text-slate-400 hover:text-blue-600"
          onClick={() => onCreateTask(project.id)}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Nova tarefa
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-400 hover:text-blue-600 gap-1"
          onClick={() => onOpenFiles(project.id)}
        >
          <Paperclip className="h-3.5 w-3.5" />
          {fileCount > 0 && <span className="text-xs">{fileCount}</span>}
        </Button>
      </div>
    </div>
  )
}
