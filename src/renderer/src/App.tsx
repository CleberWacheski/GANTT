import { DeleteConfirm } from '@renderer/components/DeleteConfirm'
import { FilesPanel } from '@renderer/components/FilesPanel'
import { GanttChart } from '@renderer/components/GanttChart'
import { ProjectCard } from '@renderer/components/ProjectCard'
import { ProjectDialog } from '@renderer/components/ProjectDialog'
import { TaskDialog } from '@renderer/components/TaskDialog'
import { cn } from '@renderer/lib/utils'
import type { FileRecord, Project, Task } from '../../preload/index.d'
import { BarChart3, LayoutGrid, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from './components/ui/button'

type View = 'projects' | 'gantt'

export default function App() {
  const [view, setView] = useState<View>('projects')
  const [projects, setProjects] = useState<Project[]>([])
  const [tasksByProject, setTasksByProject] = useState<Record<number, Task[]>>({})

  // Dialog state
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [taskProjectId, setTaskProjectId] = useState<number>(0)

  const [filesByProject, setFilesByProject] = useState<Record<number, FileRecord[]>>({})
  const [filesPanelOpen, setFilesPanelOpen] = useState(false)
  const [filesPanelProjectId, setFilesPanelProjectId] = useState<number>(0)

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void
  }>({ open: false, title: '', description: '', onConfirm: () => {} })

  const loadProjects = useCallback(async () => {
    const list = await window.api.projects.list()
    setProjects(list)
    const tasksMap: Record<number, Task[]> = {}
    const filesMap: Record<number, FileRecord[]> = {}
    await Promise.all(
      list.map(async (p) => {
        const [tasks, files] = await Promise.all([
          window.api.tasks.list(p.id),
          window.api.files.list(p.id)
        ])
        tasksMap[p.id] = tasks
        filesMap[p.id] = files
      })
    )
    setTasksByProject(tasksMap)
    setFilesByProject(filesMap)
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  // ── Project handlers ──
  const handleCreateProject = () => {
    setEditingProject(null)
    setProjectDialogOpen(true)
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setProjectDialogOpen(true)
  }

  const handleSaveProject = async (data: { name: string; description?: string; color: string }) => {
    if (editingProject) {
      await window.api.projects.update(editingProject.id, data)
    } else {
      await window.api.projects.create(data)
    }
    loadProjects()
  }

  const handleDeleteProject = (projectId: number) => {
    const project = projects.find((p) => p.id === projectId)
    setDeleteConfirm({
      open: true,
      title: 'Excluir projeto',
      description: `"${project?.name}" e todas suas tarefas serão excluídos permanentemente.`,
      onConfirm: async () => {
        await window.api.projects.delete(projectId)
        loadProjects()
      }
    })
  }

  // ── Task handlers ──
  const handleCreateTask = (projectId: number) => {
    setEditingTask(null)
    setTaskProjectId(projectId)
    setTaskDialogOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setTaskProjectId(task.projectId)
    setTaskDialogOpen(true)
  }

  const handleSaveTask = async (data: {
    name: string
    startDate: string
    endDate: string
    projectId: number
    description?: string
  }) => {
    if (editingTask) {
      await window.api.tasks.update(editingTask.id, data)
    } else {
      await window.api.tasks.create(data)
    }
    loadProjects()
  }

  const handleReorderTasks = async (projectId: number, orderedIds: number[]) => {
    setTasksByProject((prev) => {
      const tasks = prev[projectId]
      if (!tasks) return prev
      const reordered = orderedIds
        .map((id, i) => {
          const task = tasks.find((t) => t.id === id)
          return task ? { ...task, sortOrder: i } : null
        })
        .filter(Boolean) as Task[]
      return { ...prev, [projectId]: reordered }
    })
    await window.api.tasks.reorder(orderedIds)
  }

  const handleOpenFiles = (projectId: number) => {
    setFilesPanelProjectId(projectId)
    setFilesPanelOpen(true)
  }

  const handleDeleteTask = (taskId: number) => {
    const task = Object.values(tasksByProject)
      .flat()
      .find((t) => t.id === taskId)
    setDeleteConfirm({
      open: true,
      title: 'Excluir tarefa',
      description: `"${task?.name}" será excluída permanentemente.`,
      onConfirm: async () => {
        await window.api.tasks.delete(taskId)
        loadProjects()
      }
    })
  }


  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shrink-0 drag">
        <div className="flex items-center gap-4 no-drag">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <LayoutGrid className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">Gantt</h1>
              <p className="text-xs text-slate-400">Gerenciador de Projetos</p>
            </div>
          </div>

          {/* View tabs */}
          {projects.length > 0 && (
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 ml-4">
              <button
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer',
                  view === 'projects'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
                onClick={() => setView('projects')}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Projetos
              </button>
              <button
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer',
                  view === 'gantt'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
                onClick={() => setView('gantt')}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Gantt
              </button>
            </div>
          )}
        </div>
        <Button onClick={handleCreateProject} className="no-drag">
          <Plus className="h-4 w-4" />
          Novo Projeto
        </Button>
      </header>

      {/* Content */}
      {view === 'projects' ? (
        <main className="flex-1 overflow-auto p-6">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 mb-4">
                <LayoutGrid className="h-8 w-8 text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-700 mb-1">Nenhum projeto ainda</h2>
              <p className="text-sm text-slate-400 mb-4 max-w-xs">
                Crie seu primeiro projeto para começar a organizar suas tarefas.
              </p>
              <Button onClick={handleCreateProject}>
                <Plus className="h-4 w-4" />
                Criar Projeto
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  tasks={tasksByProject[project.id] ?? []}
                  onEditProject={handleEditProject}
                  onDeleteProject={handleDeleteProject}
                  onCreateTask={handleCreateTask}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  onReorderTasks={handleReorderTasks}
                  onOpenFiles={handleOpenFiles}
                  fileCount={(filesByProject[project.id] ?? []).length}
                />
              ))}
            </div>
          )}
        </main>
      ) : (
        <main className="flex-1 overflow-hidden">
          <GanttChart
            projects={projects}
            tasksByProject={tasksByProject}
            onEditTask={handleEditTask}
          />
        </main>
      )}

      {/* Dialogs */}
      <ProjectDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
        project={editingProject}
        onSave={handleSaveProject}
      />
      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        task={editingTask}
        projectId={taskProjectId}
        onSave={handleSaveTask}
      />
      <FilesPanel
        open={filesPanelOpen}
        onOpenChange={(open) => {
          setFilesPanelOpen(open)
          if (!open) loadProjects()
        }}
        projectId={filesPanelProjectId}
        projectName={projects.find((p) => p.id === filesPanelProjectId)?.name ?? ''}
        projectColor={projects.find((p) => p.id === filesPanelProjectId)?.color ?? '#3b82f6'}
      />
      <DeleteConfirm
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm((s) => ({ ...s, open }))}
        title={deleteConfirm.title}
        description={deleteConfirm.description}
        onConfirm={deleteConfirm.onConfirm}
      />
    </div>
  )
}
