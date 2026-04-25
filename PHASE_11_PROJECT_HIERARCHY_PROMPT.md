# OrgSphere — Project Hierarchy Prompt
# Generic graph model with React Flow rendering

---

## CONTEXT

OrgSphere already has project detail pages with overview, team, tasks, notes, and activity tabs.
The next project detail enhancement is a hierarchy tab that visualizes project ownership, delivery roles,
team membership, and task state in a node graph.

The graph should be implemented through a small generic graph model first, then rendered with React Flow.
This keeps the project hierarchy data independent from `@xyflow/react` so another renderer can be introduced later.

---

## IMPLEMENTATION PLAN

1. Add `@xyflow/react` to the client workspace.
2. Create generic graph primitives under `client/components/graph/`.
3. Keep React Flow-specific code inside `client/components/graph/react-flow/`.
4. Keep React Flow custom node components in a separate `nodes/` folder.
5. Add a project-specific hierarchy builder under `client/components/projects/hierarchy/`.
6. Add a `Hierarchy` tab to the project detail page.
7. Use existing project and task APIs only; do not add backend endpoints for the first version.
8. Verify with client typecheck, lint, and build.

---

## DATA SHOWN

- Project root node: name, status, tech count, member count
- Ownership nodes: project manager and tech lead
- Team node: assigned owner team
- Member nodes: project members, capped for readability with an overflow node
- Task summary node: total tasks and delivery progress
- Task status nodes: todo, in progress, review, done

---

## DESIGN RULES

- Use `@xyflow/react`, not legacy `reactflow`.
- Import React Flow stylesheet.
- Give the canvas parent explicit height.
- Use custom nodes.
- Keep `nodeTypes` stable outside component render.
- Keep the graph read-only for this phase.
- Avoid project-specific logic inside the React Flow adapter.
