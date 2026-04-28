# OrgSphere — Workflow Polish Prompt
# Task execution quality before larger feature expansion

---

## CONTEXT

OrgSphere now has project hierarchy, insights/charts, server hardening, and UI performance polish. The next
product step is to make existing daily workflows feel more complete before adding new domains.

Tasks are the execution layer of the product, so Phase 14 starts there.

---

## IMPLEMENTATION PLAN

1. Keep backend contracts stable.
2. Add reusable task workflow summary cards.
3. Improve My Tasks visibility with open, due today, overdue, and high-priority counts.
4. Add clear filter recovery on My Tasks.
5. Improve Project Tasks so tasks can be edited and deleted from the project tab.
6. Keep project-created tasks locked to the current project.
7. Verify with client typecheck and lint.

---

## DELIVERED UI

Added:

- `client/components/tasks/TaskWorkflowSummary.tsx`

Updated:

- `/my/tasks`
  - workflow summary cards
  - clear filters action
  - edit modal state cleanup on close
- `/projects/:id` Tasks tab
  - workflow summary cards for project tasks
  - edit task from task title/action
  - delete task with confirmation
  - current-project lock remains active when creating or editing from the project context

---

## PRODUCT RULES

- My Tasks remains flexible: personal tasks can be unlinked or assigned to a project.
- Project Tasks is project-specific: create/edit from this tab keeps the task linked to that project.
- Do not add a new backend concept until workflow usage proves the need.
- Keep task actions local to the page where the user is working.
