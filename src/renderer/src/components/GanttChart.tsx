import { cn } from '@renderer/lib/utils'
import type { Project, Task } from '../../../preload/index.d'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './ui/button'
import { useEffect, useMemo, useRef, useCallback, type FC } from 'react'

interface GanttChartProps {
  projects: Project[]
  tasksByProject: Record<number, Task[]>
  onEditTask: (task: Task) => void
}

const DAY_WIDTH = 44
const ROW_HEIGHT = 58
const HEADER_HEIGHT = 64

function parseDate(s: string) {
  return new Date(s + 'T00:00:00')
}

function diffDays(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function formatMonth(d: Date) {
  return d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
}

function isWeekend(d: Date) {
  return d.getDay() === 0 || d.getDay() === 6
}

function isToday(d: Date) {
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

interface GanttRow {
  task: Task
  project: Project
}

export const GanttChart: FC<GanttChartProps> = ({ projects, tasksByProject, onEditTask }) => {
  const timelineScrollRef = useRef<HTMLDivElement>(null)
  const sidebarScrollRef = useRef<HTMLDivElement>(null)
  const isSyncingRef = useRef(false)

  const rows: GanttRow[] = useMemo(() => {
    const all: GanttRow[] = []
    for (const project of projects) {
      const tasks = tasksByProject[project.id] ?? []
      const sorted = [...tasks].sort((a, b) => a.sortOrder - b.sortOrder)
      for (const task of sorted) {
        all.push({ task, project })
      }
    }
    return all
  }, [projects, tasksByProject])

  const { timelineStart, totalDays } = useMemo(() => {
    if (rows.length === 0) {
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      return { timelineStart: addDays(now, -7), totalDays: 37 }
    }

    let minDate = parseDate(rows[0].task.startDate)
    let maxDate = parseDate(rows[0].task.endDate)

    for (const row of rows) {
      const s = parseDate(row.task.startDate)
      const e = parseDate(row.task.endDate)
      if (s < minDate) minDate = s
      if (e > maxDate) maxDate = e
    }

    const start = addDays(minDate, -5)
    const end = addDays(maxDate, 10)
    return { timelineStart: start, totalDays: diffDays(start, end) }
  }, [rows])

  const days = useMemo(() => {
    const arr: Date[] = []
    for (let i = 0; i <= totalDays; i++) {
      arr.push(addDays(timelineStart, i))
    }
    return arr
  }, [timelineStart, totalDays])

  const months = useMemo(() => {
    const groups: { month: string; year: number; count: number }[] = []
    let current: (typeof groups)[0] | null = null

    for (const d of days) {
      const m = formatMonth(d)
      const y = d.getFullYear()
      if (!current || current.month !== m || current.year !== y) {
        current = { month: m, year: y, count: 1 }
        groups.push(current)
      } else {
        current.count++
      }
    }
    return groups
  }, [days])

  const todayIndex = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return diffDays(timelineStart, now)
  }, [timelineStart])

  // Scroll to today on mount
  useEffect(() => {
    if (!timelineScrollRef.current) return
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const dayIndex = diffDays(timelineStart, now)
    const targetX = dayIndex * DAY_WIDTH - timelineScrollRef.current.clientWidth / 3
    timelineScrollRef.current.scrollLeft = Math.max(0, targetX)
  }, [timelineStart])

  // Sync vertical scroll between sidebar and timeline
  const handleTimelineScroll = useCallback(() => {
    if (isSyncingRef.current) return
    isSyncingRef.current = true
    if (timelineScrollRef.current && sidebarScrollRef.current) {
      sidebarScrollRef.current.scrollTop = timelineScrollRef.current.scrollTop
    }
    requestAnimationFrame(() => {
      isSyncingRef.current = false
    })
  }, [])

  const handleSidebarScroll = useCallback(() => {
    if (isSyncingRef.current) return
    isSyncingRef.current = true
    if (timelineScrollRef.current && sidebarScrollRef.current) {
      timelineScrollRef.current.scrollTop = sidebarScrollRef.current.scrollTop
    }
    requestAnimationFrame(() => {
      isSyncingRef.current = false
    })
  }, [])

  const scrollByDays = (n: number) => {
    timelineScrollRef.current?.scrollBy({ left: n * DAY_WIDTH, behavior: 'smooth' })
  }

  const scrollToToday = () => {
    if (!timelineScrollRef.current) return
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const dayIdx = diffDays(timelineStart, now)
    const targetX = dayIdx * DAY_WIDTH - timelineScrollRef.current.clientWidth / 3
    timelineScrollRef.current.scrollTo({ left: Math.max(0, targetX), behavior: 'smooth' })
  }

  const timelineWidth = (totalDays + 1) * DAY_WIDTH
  const contentHeight = rows.length * ROW_HEIGHT

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <div className="text-slate-300 text-sm">Nenhuma tarefa para exibir no Gantt</div>
        <p className="text-xs text-slate-400 mt-1">
          Crie tarefas nos projetos para visualizá-las aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => scrollByDays(-7)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={scrollToToday}>
            Hoje
          </Button>
          <Button variant="ghost" size="icon" onClick={() => scrollByDays(7)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          {projects.map((p) => (
            <div key={p.id} className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-xs text-slate-500">{p.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="shrink-0 w-52 border-r border-slate-200 bg-white z-10 flex flex-col">
          <div
            className="border-b border-slate-200 flex items-end px-3 pb-2 shrink-0"
            style={{ height: HEADER_HEIGHT }}
          >
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Tarefas
            </span>
          </div>
          <div
            ref={sidebarScrollRef}
            className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar"
            onScroll={handleSidebarScroll}
          >
            <div style={{ height: contentHeight }}>
              {rows.map(({ task, project }) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 px-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors"
                  style={{ height: ROW_HEIGHT }}
                  onClick={() => onEditTask(task)}
                >
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate leading-tight">
                      {task.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{project.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div
          ref={timelineScrollRef}
          className="flex-1 overflow-auto"
          onScroll={handleTimelineScroll}
        >
          <div style={{ width: timelineWidth, height: contentHeight + HEADER_HEIGHT }}>
            {/* Sticky header */}
            <div
              className="sticky top-0 z-20 bg-white border-b border-slate-200"
              style={{ height: HEADER_HEIGHT }}
            >
              <div className="flex h-8 border-b border-slate-100">
                {months.map((m, i) => (
                  <div
                    key={i}
                    className="flex items-center px-2 border-r border-slate-100 text-xs font-semibold text-slate-600 capitalize"
                    style={{ width: m.count * DAY_WIDTH }}
                  >
                    {m.month} {m.year}
                  </div>
                ))}
              </div>
              <div className="flex h-8">
                {days.map((d, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex items-center justify-center text-[11px] border-r border-slate-50',
                      isToday(d)
                        ? 'text-blue-600 font-bold'
                        : isWeekend(d)
                          ? 'text-slate-300'
                          : 'text-slate-400'
                    )}
                    style={{ width: DAY_WIDTH }}
                  >
                    {d.getDate()}
                  </div>
                ))}
              </div>
            </div>

            {/* Grid body */}
            <div className="relative" style={{ height: contentHeight }}>
              {/* Weekend shading + grid lines */}
              {days.map((d, i) => (
                <div
                  key={i}
                  className={cn(
                    'absolute top-0 border-r',
                    isWeekend(d) ? 'bg-slate-50/60 border-slate-100' : 'border-slate-50'
                  )}
                  style={{ left: i * DAY_WIDTH, width: DAY_WIDTH, height: contentHeight }}
                />
              ))}

              {/* Today line */}
              {todayIndex >= 0 && todayIndex <= totalDays && (
                <div
                  className="absolute top-0 w-0.5 bg-blue-500 z-10"
                  style={{
                    left: todayIndex * DAY_WIDTH + DAY_WIDTH / 2,
                    height: contentHeight
                  }}
                >
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-blue-500" />
                </div>
              )}

              {/* Row lines */}
              {rows.map((_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 border-b border-slate-50"
                  style={{ top: (i + 1) * ROW_HEIGHT }}
                />
              ))}

              {/* Task bars */}
              {rows.map(({ task, project }, rowIndex) => {
                const start = parseDate(task.startDate)
                const end = parseDate(task.endDate)
                const startDay = diffDays(timelineStart, start)
                const duration = diffDays(start, end) + 1
                const barLeft = startDay * DAY_WIDTH
                const barWidth = Math.max(duration * DAY_WIDTH, DAY_WIDTH)
                const barTop = rowIndex * ROW_HEIGHT + 8

                return (
                  <div
                    key={task.id}
                    className="absolute group cursor-pointer z-[5]"
                    style={{ left: barLeft, width: barWidth, top: barTop }}
                    onClick={() => onEditTask(task)}
                  >
                    {/* Bar */}
                    <div
                      className="relative h-8 rounded-md overflow-hidden transition-shadow hover:shadow-md"
                      style={{ backgroundColor: project.color + '18' }}
                    >
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-md"
                        style={{ backgroundColor: project.color }}
                      />
                      <div className="relative flex items-center h-full pl-3 pr-2">
                        <span
                          className="text-xs font-medium truncate"
                          style={{ color: project.color }}
                        >
                          {task.name}
                        </span>
                      </div>
                    </div>

                    {/* Project badge */}
                    <div className="flex items-center gap-1 mt-0.5 pl-1">
                      <div
                        className="h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="text-[10px] text-slate-400 truncate">{project.name}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
