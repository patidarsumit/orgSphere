# OrgSphere — Project Health And Risk Signals Prompt
# Explainable project risk from ownership, task pressure, and recent movement

---

## CONTEXT

OrgSphere already tracks projects, tasks, ownership, teams, members, activity, hierarchy, and insights. Phase 15
turns that operational data into explainable project health signals so managers can see where to act first.

The goal is not predictive magic. The goal is trusted, simple risk scoring with visible reasons.

---

## ACCEPTANCE CRITERIA

1. Existing project, task, dashboard, notes, graph, and insights flows continue to work.
2. No database schema migration is required.
3. Health APIs are additive and do not change existing API response shapes.
4. Project health is explainable: every score includes reason strings.
5. Completed and archived projects are not penalized for normal inactivity.
6. Missing ownership is visible as a risk signal.
7. Overdue and high-priority open tasks affect the score.
8. Dashboard shows top projects needing attention.
9. Project detail overview shows a health panel before deeper charts.
10. Typecheck, lint, and builds pass for touched workspaces.

---

## BACKEND APIS

Added:

- `GET /api/projects/health`
- `GET /api/projects/:id/health`

Health response includes:

- `status`: `healthy | attention | at_risk`
- `score`
- `completionPercent`
- `totalTasks`
- `openTasks`
- `overdueTasks`
- `highPriorityOpenTasks`
- `staleDays`
- `missingOwnership`
- `reasons`

---

## SCORING MODEL

Starting score: `100`

Signals:

- missing manager / tech lead / team / members
- overdue open tasks
- high-priority open tasks
- stale project movement
- no tasks tracked yet

Score bands:

- `80-100`: healthy
- `55-79`: attention
- `0-54`: at risk

Completed and archived projects are excluded from stale/active task pressure penalties.

---

## FRONTEND SURFACES

Added:

- dashboard project health card
- project detail health panel
- reusable health badge and project risk card

Updated:

- dashboard
- project detail overview

---

## DESIGN RULES

- Health should be actionable, not decorative.
- Risk reasons must be plain language.
- Avoid extra API calls inside repeated project cards unless a page explicitly needs live health.
- Keep the scoring model conservative until real usage shows better thresholds.
