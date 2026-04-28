# OrgSphere — Notification Navigation Hardening Prompt
# Permission-safe activity links before true notifications

---

## CONTEXT

OrgSphere currently uses activity logs as the header notification stream. That is useful for MVP visibility,
but global activity can point users to entities they cannot open. Example: an admin-created task can appear for
another user, but `/my/tasks?task=:id` only works when the task is assigned to that user.

Phase 16A hardens navigation without introducing a notifications table yet.

---

## ACCEPTANCE CRITERIA

1. Existing activity feeds and header notification UI continue to render.
2. Existing activity fields remain in the response shape.
3. Activity responses add `href` and `is_navigable`.
4. Frontend no longer guesses entity URLs from `entity_type`.
5. Task activity links to `/my/tasks?task=:id` only when the task is assigned to the viewer.
6. Task activity for other users links to the parent project when available.
7. Private note activity links only for the note owner.
8. Deleted entity activity does not link to deleted detail pages.
9. Post activity links to public blog for published posts and content workspace for drafts.
10. Typecheck, lint, and builds pass.

---

## IMPLEMENTATION

Backend:

- `server/src/utils/activity.formatter.ts`
  - adds permission-aware navigation context
  - batches task, note, and post lookups
  - returns `href` and `is_navigable`

Frontend:

- `client/components/activity/ActivityFeedItem.tsx`
  - uses backend-provided `href`
  - renders non-clickable rows when `href` is null
- `client/types/index.ts`
  - adds `href` and `is_navigable` to `ActivityItem`

---

## DESIGN RULES

- Activity is a timeline; notifications are actionable inbox items.
- Until true notifications exist, header activity rows must never link to inaccessible targets.
- Backend owns activity navigation because it can check access and entity state.
- Frontend renders navigation; it does not decide permissions.

---

## FUTURE WORK

Phase 16B should add a dedicated notifications table:

```text
notifications
- id
- recipient_id
- activity_log_id nullable
- message
- target_url nullable
- read_at nullable
- created_at
```

After that, the bell should use `/api/notifications`, while activity feeds remain history/timeline surfaces.
