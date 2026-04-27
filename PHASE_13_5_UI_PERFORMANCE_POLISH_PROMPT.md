# OrgSphere — UI Performance and Polish Prompt
# Stable chart measurement and lazy-loaded visual surfaces

---

## CONTEXT

Phase 12 introduced Recharts insight surfaces and Phase 11 introduced React Flow hierarchy views. Those are the
right libraries for OrgSphere, but both are heavier than ordinary UI components. Before adding the next feature
phase, the client needs a small performance and stability pass.

---

## IMPLEMENTATION PLAN

1. Replace brittle chart width handling with a measured chart frame.
2. Keep chart empty states consistent across donut, bar, line, and progress charts.
3. Lazy-load dashboard insight widgets so Recharts is not part of the dashboard's first interactive surface.
4. Lazy-load project health insights on project detail pages.
5. Lazy-load the React Flow canvas inside the hierarchy tab.
6. Keep loading placeholders stable to avoid layout jumps.
7. Verify with client typecheck, lint, and build.

---

## UI PERFORMANCE CHANGES

Added:

- `client/components/charts/MeasuredChartFrame.tsx`
  - measures chart width with `ResizeObserver`
  - renders Recharts only after a positive width exists
  - provides shared chart empty-state UI
- `client/components/insights/InsightsGridSkeleton.tsx`
  - stable loading placeholder for dynamic insight sections

Updated:

- `HorizontalBarInsightChart`
- `LineInsightChart`
- `DonutInsightChart`
- `ProgressInsightList`
- dashboard page insight loading
- project detail health insight loading
- project hierarchy React Flow canvas loading

---

## DESIGN RULES

- Use Recharts for aggregate analytics only.
- Use React Flow for relationship/hierarchy canvases only.
- Keep chart containers at stable heights.
- Do not render Recharts with unknown or negative dimensions.
- Dynamically load heavy visual modules when they are not required for the first interactive page shell.
- Prefer small reusable UI primitives over one-off fixes.
