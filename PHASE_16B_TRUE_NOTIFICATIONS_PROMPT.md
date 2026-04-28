# OrgSphere — True Notifications Prompt
# User-specific actionable inbox separate from activity history

---

## CONTEXT

OrgSphere previously used global activity logs as the header notification stream. Phase 16A made those activity
links safer, but activity is still a timeline, not a personal inbox.

Phase 16B introduces user-specific notifications so the bell only shows actionable updates meant for the
current user.

---

## ACCEPTANCE CRITERIA

1. Activity feed continues to work as workspace/project history.
2. Header bell uses `/api/notifications`, not `/api/activity`.
3. Notifications are scoped by `recipient_id`.
4. Unread count comes from unread notifications only.
5. Opening the bell does not automatically mark everything read.
6. Clicking a notification marks that notification read.
7. “Mark all read” remains explicit.
8. Notification targets are controlled by the backend.
9. Existing project/task APIs keep their response shapes.
10. Typecheck, lint, builds, and migration code pass.

---

## BACKEND

Added:

- `notifications` table
- `Notification` entity
- `notification.service.ts`
- `notification.controller.ts`
- `notification.routes.ts`

Routes:

- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `POST /api/notifications/mark-read`
- `POST /api/notifications/:id/read`

Initial triggers:

- task assigned to a user, excluding self-created/self-assigned tasks
- user added to a project
- user removed from a project
- user becomes project manager
- user becomes project tech lead

---

## FRONTEND

Added:

- `client/types/notifications.ts`
- `client/hooks/useNotifications.ts`
- `client/components/layout/NotificationFeedItem.tsx`

Updated:

- header bell now renders user-specific notifications
- activity feed remains separate

---

## DESIGN RULES

- Activity answers: “what happened?”
- Notifications answer: “what needs my attention?”
- Do not notify everyone for global activity.
- Do not create notifications for private notes unless sharing/mentions exist.
- Do not mark all notifications read just because the bell was opened.
- Comments and mentions should build on this notification model.
