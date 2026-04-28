'use client'

import { AlertTriangle, CalendarClock, CheckCircle2, Flag } from 'lucide-react'
import { Task } from '@/types'

const todayStart = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

const toLocalDate = (value: string) => new Date(`${value}T00:00:00`)

export function getTaskWorkflowSummary(tasks: Task[]) {
  const today = todayStart()

  return {
    open: tasks.filter((task) => task.status !== 'done').length,
    dueToday: tasks.filter(
      (task) =>
        task.status !== 'done' &&
        task.due_date &&
        toLocalDate(task.due_date).getTime() === today.getTime()
    ).length,
    overdue: tasks.filter(
      (task) => task.status !== 'done' && task.due_date && toLocalDate(task.due_date) < today
    ).length,
    highPriority: tasks.filter((task) => task.status !== 'done' && task.priority === 'high').length,
  }
}

export function TaskWorkflowSummary({ tasks }: { tasks: Task[] }) {
  const summary = getTaskWorkflowSummary(tasks)
  const cards = [
    {
      label: 'Open',
      value: summary.open,
      icon: CheckCircle2,
      tone: 'text-[color:var(--color-primary)] bg-[color:var(--color-primary-light)]',
    },
    {
      label: 'Due Today',
      value: summary.dueToday,
      icon: CalendarClock,
      tone: 'text-amber-700 bg-amber-50',
    },
    {
      label: 'Overdue',
      value: summary.overdue,
      icon: AlertTriangle,
      tone: 'text-red-700 bg-red-50',
    },
    {
      label: 'High Priority',
      value: summary.highPriority,
      icon: Flag,
      tone: 'text-rose-700 bg-rose-50',
    },
  ]

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon

        return (
          <div
            key={card.label}
            className="flex items-center justify-between gap-3 rounded-xl border border-[color:var(--color-border)] bg-white p-4 shadow-sm"
          >
            <div>
              <p className="text-[10px] font-black uppercase text-[color:var(--color-text-tertiary)]">
                {card.label}
              </p>
              <p className="mt-1 text-2xl font-black text-[color:var(--color-text-primary)]">
                {card.value}
              </p>
            </div>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.tone}`}>
              <Icon size={18} />
            </span>
          </div>
        )
      })}
    </section>
  )
}
