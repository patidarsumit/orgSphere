'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { parseAsString, useQueryState } from 'nuqs'
import {
  CheckSquare,
  Grid2X2,
  ListChecks,
  Plus,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react'
import { useSelector } from 'react-redux'
import { TaskFormModal } from '@/components/tasks/TaskFormModal'
import {
  formatTaskDueDate,
  getDueTone,
  priorityDotClass,
  taskPriorityLabels,
  taskStatusLabels,
} from '@/components/tasks/taskUtils'
import { Avatar } from '@/components/shared/Avatar'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useDeleteTask, useTasks, useUpdateTask } from '@/hooks/useTasks'
import { RootState } from '@/store'
import { Task, TaskPriority, TaskStatus } from '@/types'

const statuses: Array<{ value: TaskStatus | ''; label: string }> = [
  { value: '', label: 'All Tasks' },
  { value: 'todo', label: 'To-Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Completed' },
]

const kanbanColumns: TaskStatus[] = ['todo', 'in_progress', 'review', 'done']

function TaskCheckbox({ task }: { task: Task }) {
  const updateTask = useUpdateTask()
  const isDone = task.status === 'done'

  return (
    <button
      type="button"
      onClick={() =>
        void updateTask.mutateAsync({
          id: task.id,
          status: isDone ? 'todo' : 'done',
        })
      }
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
        isDone
          ? 'border-green-600 bg-green-600 text-white'
          : 'border-[color:var(--color-border-strong)] bg-white'
      }`}
      aria-label={isDone ? 'Mark task as open' : 'Mark task as done'}
    >
      {isDone ? <CheckSquare size={13} /> : null}
    </button>
  )
}

function TaskList({
  tasks,
  onEdit,
  onDelete,
}: {
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="No tasks match your filters"
        description="Adjust the status or priority filters to bring work back into view."
      />
    )
  }

  return (
    <section className="overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-white shadow-[var(--shadow-card)]">
      <div className="grid grid-cols-[44px_1.7fr_1fr_120px_110px_110px_56px] gap-3 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-low)] px-4 py-3 text-[10px] font-black uppercase text-[color:var(--color-text-tertiary)] max-lg:hidden">
        <span />
        <span>Task Title</span>
        <span>Project</span>
        <span>Status</span>
        <span>Priority</span>
        <span>Due Date</span>
        <span>Actions</span>
      </div>
      <div className="divide-y divide-[color:var(--color-border)]">
        {tasks.map((task) => {
          const isDone = task.status === 'done'
          return (
            <article
              key={task.id}
              className={`grid min-h-12 grid-cols-[32px_1fr_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-[color:var(--color-surface-low)] lg:grid-cols-[44px_1.7fr_1fr_120px_110px_110px_56px] ${
                isDone ? 'opacity-60' : ''
              }`}
            >
              <TaskCheckbox task={task} />
              <button
                type="button"
                onClick={() => onEdit(task)}
                className={`min-w-0 text-left text-sm font-medium text-[color:var(--color-text-primary)] hover:text-[color:var(--color-primary)] ${
                  isDone ? 'line-through' : ''
                }`}
              >
                <span className="block truncate">{task.title}</span>
                {task.description ? (
                  <span className="block truncate text-xs font-normal text-[color:var(--color-text-tertiary)] lg:hidden">
                    {task.description}
                  </span>
                ) : null}
              </button>
              <div className="hidden lg:block">
                {task.project ? (
                  <Link
                    href={`/projects/${task.project.id}`}
                    className="inline-flex rounded-full bg-[color:var(--color-surface-low)] px-2.5 py-1 text-xs font-semibold text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-primary)]"
                  >
                    {task.project.name}
                  </Link>
                ) : (
                  <span className="text-sm text-[color:var(--color-text-tertiary)]">-</span>
                )}
              </div>
              <div className="hidden lg:block">
                <StatusBadge status={task.status} />
              </div>
              <div className="hidden items-center gap-2 text-sm text-[color:var(--color-text-secondary)] lg:flex">
                <span className={`h-2 w-2 rounded-full ${priorityDotClass[task.priority]}`} />
                {taskPriorityLabels[task.priority]}
              </div>
              <div className="hidden lg:block">
                <span className={`rounded-full px-2 py-1 text-xs font-bold ${getDueTone(task.due_date, task.status)}`}>
                  {formatTaskDueDate(task.due_date)}
                </span>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onDelete(task)}
                  className="rounded-lg p-2 text-[color:var(--color-text-tertiary)] hover:bg-red-50 hover:text-red-600"
                  aria-label="Delete task"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function KanbanView({
  tasks,
  onEdit,
  onAdd,
}: {
  tasks: Task[]
  onEdit: (task: Task) => void
  onAdd: (status: TaskStatus) => void
}) {
  const currentUser = useSelector((state: RootState) => state.auth.user)
  const tasksByStatus = useMemo(
    () =>
      kanbanColumns.reduce<Record<TaskStatus, Task[]>>(
        (acc, status) => {
          acc[status] = tasks.filter((task) => task.status === status)
          return acc
        },
        { todo: [], in_progress: [], review: [], done: [] }
      ),
    [tasks]
  )

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
      {kanbanColumns.map((status) => (
        <section
          key={status}
          className="flex max-h-[calc(100vh-220px)] min-h-[420px] flex-col rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-low)]"
        >
          <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-4 py-3">
            <h2 className="text-xs font-black uppercase text-[color:var(--color-text-primary)]">
              {taskStatusLabels[status]}
            </h2>
            <span className="rounded-full bg-[color:var(--color-primary)] px-2 py-0.5 text-xs font-bold text-white">
              {tasksByStatus[status].length}
            </span>
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
            {tasksByStatus[status].map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => onEdit(task)}
                className="block w-full rounded-lg border border-[color:var(--color-border)] bg-white p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-[color:var(--color-primary-light)] px-2 py-0.5 text-[10px] font-bold text-[color:var(--color-primary)]">
                    {task.project?.name || 'Personal'}
                  </span>
                  <span className={`h-2 w-2 rounded-full ${priorityDotClass[task.priority]}`} />
                </div>
                <h3 className="mt-3 line-clamp-2 text-sm font-medium text-[color:var(--color-text-primary)]">
                  {task.title}
                </h3>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className={`text-xs font-semibold ${getDueTone(task.due_date, task.status)}`}>
                    {formatTaskDueDate(task.due_date)}
                  </span>
                  <Avatar
                    name={currentUser?.name || 'OrgSphere'}
                    avatarPath={currentUser?.avatar_path}
                    size="sm"
                  />
                </div>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onAdd(status)}
            className="m-3 rounded-lg border border-dashed border-[color:var(--color-border-strong)] bg-white px-3 py-2 text-sm font-bold text-[color:var(--color-primary)] hover:bg-[color:var(--color-primary-light)]"
          >
            + Add task
          </button>
        </section>
      ))}
    </div>
  )
}

export default function MyTasksPage() {
  const [isPending, startTransition] = useTransition()
  const [view, setView] = useQueryState(
    'view',
    parseAsString.withDefault('list').withOptions({ startTransition })
  )
  const [status, setStatus] = useQueryState(
    'status',
    parseAsString.withDefault('').withOptions({ startTransition })
  )
  const [priority, setPriority] = useQueryState(
    'priority',
    parseAsString.withDefault('').withOptions({ startTransition })
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo')
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null)
  const deleteTask = useDeleteTask()

  const { data, isLoading } = useTasks({
    status: status as TaskStatus | '',
    priority: priority as TaskPriority | '',
    limit: 100,
  })
  const tasks = data?.data || []

  const openAdd = (nextStatus: TaskStatus = 'todo') => {
    setDefaultStatus(nextStatus)
    setEditingTask(null)
    setModalOpen(true)
  }

  return (
    <div className="-m-8 min-h-full bg-[color:var(--color-surface-low)] p-5 sm:p-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-[color:var(--color-primary)]">
            My Workspace
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[color:var(--color-text-primary)]">
            My Active Tasks
          </h1>
          <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
            Plan, review, and close the work assigned to you.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-[color:var(--color-border)] bg-white p-1">
            <button
              type="button"
              onClick={() => void setView('list')}
              className={`rounded-md p-2 ${view === 'list' ? 'bg-[color:var(--color-primary)] text-white' : 'text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-low)]'}`}
              aria-label="List view"
            >
              <ListChecks size={18} />
            </button>
            <button
              type="button"
              onClick={() => void setView('kanban')}
              className={`rounded-md p-2 ${view === 'kanban' ? 'bg-[color:var(--color-primary)] text-white' : 'text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-low)]'}`}
              aria-label="Kanban view"
            >
              <Grid2X2 size={18} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => openAdd()}
            className="primary-gradient inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white"
          >
            <Plus size={17} />
            Add Task
          </button>
        </div>
      </header>

      <section className="mb-5 rounded-xl border border-[color:var(--color-border)] bg-white p-3 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {statuses.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => void setStatus(item.value)}
                className={`rounded-full px-3 py-1.5 text-sm font-bold transition-colors ${
                  status === item.value
                    ? 'bg-[color:var(--color-primary)] text-white'
                    : 'bg-[color:var(--color-surface-low)] text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-primary)]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SlidersHorizontal size={16} className="text-[color:var(--color-text-tertiary)]" />
            <select
              value={priority}
              onChange={(event) => void setPriority(event.target.value)}
              className="rounded-lg border border-[color:var(--color-border-strong)] bg-white px-3 py-2 text-sm outline-none focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary)]/15"
            >
              <option value="">All priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <div className="flex items-center gap-3 text-xs font-semibold text-[color:var(--color-text-tertiary)]">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> High</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Medium</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-gray-400" /> Low</span>
            </div>
          </div>
        </div>
      </section>

      {isLoading || isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-xl bg-white" />
          ))}
        </div>
      ) : view === 'kanban' ? (
        <KanbanView
          tasks={tasks}
          onEdit={(task) => {
            setEditingTask(task)
            setModalOpen(true)
          }}
          onAdd={openAdd}
        />
      ) : (
        <TaskList
          tasks={tasks}
          onEdit={(task) => {
            setEditingTask(task)
            setModalOpen(true)
          }}
          onDelete={setDeleteTarget}
        />
      )}

      {tasks.length === 0 && !isLoading ? (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => openAdd()}
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-[color:var(--color-border-strong)] bg-white px-4 py-2 text-sm font-bold text-[color:var(--color-primary)] hover:bg-[color:var(--color-primary-light)]"
          >
            <Plus size={16} />
            Create your first task
          </button>
        </div>
      ) : null}

      <TaskFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        task={editingTask}
        defaults={{ status: defaultStatus }}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete task?"
        description="This task will be removed from your workspace."
        dangerous
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            void deleteTask.mutateAsync(deleteTarget.id)
          }
          setDeleteTarget(null)
        }}
      />
    </div>
  )
}
