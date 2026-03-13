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
import type { Task } from '../../../preload/index.d'
import { useEffect, useState, useMemo, type FC } from 'react'

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
  projectId: number
  onSave: (data: {
    name: string
    startDate: string
    endDate: string
    projectId: number
    description?: string
  }) => void
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function weekLaterStr() {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().split('T')[0]
}

export const TaskDialog: FC<TaskDialogProps> = ({
  open,
  onOpenChange,
  task,
  projectId,
  onSave
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState(todayStr())
  const [endDate, setEndDate] = useState(weekLaterStr())
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (open) {
      setName(task?.name ?? '')
      setDescription(task?.description ?? '')
      setStartDate(task?.startDate ?? todayStr())
      setEndDate(task?.endDate ?? weekLaterStr())
      setTouched({})
    }
  }, [open, task])

  const errors = useMemo(() => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Nome é obrigatório'
    if (!startDate) e.startDate = 'Data de início é obrigatória'
    if (!endDate) e.endDate = 'Data de fim é obrigatória'
    if (startDate && endDate && endDate < startDate)
      e.endDate = 'Fim deve ser igual ou após o início'
    return e
  }, [name, startDate, endDate])

  const isValid = Object.keys(errors).length === 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ name: true, startDate: true, endDate: true })
    if (!isValid) return
    onSave({
      name: name.trim(),
      startDate,
      endDate,
      projectId,
      description: description.trim() || undefined
    })
    onOpenChange(false)
  }

  // Auto-adjust endDate when startDate changes past it
  const handleStartDateChange = (val: string) => {
    setStartDate(val)
    setTouched((t) => ({ ...t, startDate: true }))
    if (val && endDate && val > endDate) {
      setEndDate(val)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
          <DialogDescription>
            {task ? 'Edite as informações da tarefa.' : 'Adicione uma nova tarefa ao projeto.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nome</label>
            <Input
              placeholder="Nome da tarefa"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setTouched((t) => ({ ...t, name: true }))
              }}
              autoFocus
              className={
                touched.name && errors.name ? 'border-red-300 focus-visible:ring-red-400' : ''
              }
            />
            {touched.name && errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Descrição</label>
            <Textarea
              placeholder="Descrição opcional..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Início</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className={
                  touched.startDate && errors.startDate
                    ? 'border-red-300 focus-visible:ring-red-400'
                    : ''
                }
              />
              {touched.startDate && errors.startDate && (
                <p className="text-xs text-red-500">{errors.startDate}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Fim</label>
              <Input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setTouched((t) => ({ ...t, endDate: true }))
                }}
                className={
                  touched.endDate && errors.endDate
                    ? 'border-red-300 focus-visible:ring-red-400'
                    : ''
                }
              />
              {touched.endDate && errors.endDate && (
                <p className="text-xs text-red-500">{errors.endDate}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={Object.keys(touched).length > 0 && !isValid}>
              {task ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
