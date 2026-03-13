import { Button } from '@renderer/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Textarea } from '@renderer/components/ui/textarea'
import type { Project } from '../../../preload/index.d'
import { useState, type FC } from 'react'

const COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#10b981',
  '#06b6d4',
  '#6366f1',
  '#f43f5e'
]

interface ProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: Project | null
  onSave: (data: { name: string; description?: string; color: string }) => void
}

function ProjectForm({
  project,
  onSave,
  onClose
}: {
  project?: Project | null
  onSave: (data: { name: string; description?: string; color: string }) => void
  onClose: () => void
}) {
  const [name, setName] = useState(project?.name ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [color, setColor] = useState(project?.color ?? COLORS[0])
  const [touched, setTouched] = useState(false)

  const nameError = !name.trim() ? 'Nome é obrigatório' : ''

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (nameError) return
    onSave({ name: name.trim(), description: description.trim() || undefined, color })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Nome</label>
        <Input
          placeholder="Nome do projeto"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setTouched(true)
          }}
          autoFocus
          className={touched && nameError ? 'border-red-300 focus-visible:ring-red-400' : ''}
        />
        {touched && nameError && <p className="text-xs text-red-500">{nameError}</p>}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Descrição</label>
        <Textarea
          placeholder="Descrição opcional..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Cor</label>
        <div className="flex gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className="h-8 w-8 rounded-full transition-all cursor-pointer"
              style={{
                backgroundColor: c,
                outline: color === c ? '2px solid' : 'none',
                outlineColor: c,
                outlineOffset: '2px'
              }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>
      <DialogFooter>
        <DialogClose>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={touched && !!nameError}>
          {project ? 'Salvar' : 'Criar'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export const ProjectDialog: FC<ProjectDialogProps> = ({ open, onOpenChange, project, onSave }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{project ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle>
          <DialogDescription>
            {project
              ? 'Edite as informações do projeto.'
              : 'Crie um novo projeto para organizar suas tarefas.'}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ProjectForm
            key={project?.id ?? 'new'}
            project={project}
            onSave={onSave}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
