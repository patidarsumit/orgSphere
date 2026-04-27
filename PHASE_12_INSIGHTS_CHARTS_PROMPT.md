# OrgSphere — Insights and Charts Prompt
# Aggregate analytics APIs with reusable Recharts UI

---

## CONTEXT

OrgSphere already has strong operational list/detail pages and a React Flow hierarchy view for relationship
visualization. The next enhancement is chart-based insight surfaces that summarize delivery health, workload,
portfolio state, and personal task load without cluttering list pages.

React Flow remains responsible for relationship and node-based UI. Recharts is used for chart analytics.

---

## IMPLEMENTATION PLAN

1. Add `recharts` to the client workspace.
2. Add backend aggregate insight APIs instead of deriving charts from paginated list responses.
3. Keep aggregate query logic in a dedicated backend service.
4. Add reusable chart primitives under `client/components/charts/`.
5. Add domain-specific insight sections under `client/components/insights/`.
6. Add a dedicated `/projects/insights` route.
7. Add a dedicated `/my/tasks/insights` route.
8. Add an `Insights` action next to list-page create actions.
9. Add compact project health insights to the project detail overview tab.
10. Verify with server typecheck, client typecheck, and client lint.

---

## BACKEND APIS

- `GET /api/dashboard/insights`
- `GET /api/projects/insights`
- `GET /api/projects/:id/insights`
- `GET /api/tasks/my/insights`

These APIs return aggregated chart-ready data:

- project status breakdown
- task status breakdown
- task priority breakdown
- team workload
- activity trend
- project ownership/technology usage
- project completion
- assignee workload
- personal due-soon task trend
- personal open task load by project

---

## FRONTEND SURFACES

- Dashboard:
  - insights row after KPI cards
  - project status, task status, team workload, activity trend, priority mix
- Projects list:
  - `Insights` button beside `Add Project`
- Projects insights page:
  - portfolio status, projects by team, tech stack usage, open work by project, completion
- Project detail overview:
  - compact project health charts before mission/team content
- My tasks:
  - `Insights` button beside task view/create controls
- My task insights page:
  - personal task status, priority mix, due soon trend, project load

---

## DESIGN RULES

- Keep list pages operational and uncluttered.
- Put deeper analytics in dedicated insights routes.
- Use generic chart primitives that can be reused by teams, employees, blog, and settings later.
- Keep chart data contracts explicit in `client/types/insights.ts`.
- Do not build chart totals from paginated list responses.
- Use Recharts only in client components.
- Keep chart containers at stable heights so responsive charts render correctly.
- Keep React Flow and Recharts responsibilities separate.
