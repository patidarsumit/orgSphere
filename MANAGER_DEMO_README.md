# OrgSphere Manager Demo README

This document is for demo and stakeholder review. It explains who OrgSphere serves, what problem it solves, what has been built, and how the product can work for organizations that already have existing tools and data.

## Executive Summary

OrgSphere is an internal collaboration and org-visibility platform for teams that need one place to understand people, projects, teams, work, notes, activity, and project health.

The current product is not only a directory or task tracker. It connects operational data into a workspace where managers can answer:

- Who owns this project?
- Who is working on it?
- What work is open?
- Which projects need attention?
- What changed recently?
- What do I personally need to act on?

## Audience

Primary customers:

- Engineering managers
- Delivery managers
- Project managers
- Team leads
- Department heads
- Startup and mid-sized company operators

Secondary users:

- Individual contributors tracking assigned tasks
- HR/admin users managing people and roles
- Content or internal communications teams managing company posts

Best-fit organizations:

- Companies with multiple teams and projects
- Growing engineering/product organizations
- Teams where project ownership, staffing, and task status are spread across too many places
- Organizations that need lightweight visibility without a heavy enterprise project-management rollout

## Problem

Most growing teams do not suffer from lack of tools. They suffer from fragmented context.

Common customer problems:

- Employee information lives in one system.
- Team membership is maintained somewhere else.
- Project ownership is unclear or outdated.
- Tasks are tracked, but not connected clearly to people and teams.
- Notes and decisions are personal or scattered.
- Activity is visible only if someone knows where to look.
- Managers cannot quickly see which projects are healthy, stale, or at risk.
- Notifications are noisy when every event is treated like a personal action item.

Why this matters:

- Managers waste time asking for status.
- Risks are discovered late.
- Project ownership gaps stay hidden.
- New joiners struggle to understand who owns what.
- Teams duplicate work or lose decisions.
- Leadership sees activity but not actionable health signals.

## Proposal

OrgSphere solves this by creating a connected operating layer for internal work.

The product combines:

- people directory
- team structure
- project ownership
- task execution
- private notes linked to work
- activity timeline
- actionable notifications
- graph-based hierarchy visualization
- chart-based insights
- project health and risk signals

The core proposal:

> OrgSphere turns scattered internal work data into a clear operating view for managers and teams.

## What Has Been Built

### Public Surface

- Public landing page
- Public blog
- Blog detail pages
- Tag-filtered blog pages

Business value:

- Gives the product a public-facing communication layer.
- Allows company/product content to be published externally.

### Authentication And Workspace Shell

- Login
- JWT access token and refresh cookie flow
- Protected app shell
- Sidebar navigation
- Header search and notifications
- Breadcrumb navigation

Business value:

- Separates public and internal surfaces.
- Gives authenticated users a consistent workspace.

### Employee Directory

- Employee list
- Employee profile pages
- Role, department, skills, manager hierarchy data
- Avatar/profile support

Business value:

- Makes people discovery easier.
- Helps managers understand reporting and skill context.

### Teams

- Team list
- Team detail pages
- Team membership
- Team project linkage

Business value:

- Shows how people are grouped.
- Helps connect teams to active delivery work.

### Projects

- Project list
- Project detail page
- Manager, tech lead, team, members, status, tech stack
- Project member management
- Project tabs for overview, hierarchy, team, tasks, notes, and activity

Business value:

- Creates one clear place to understand a project.
- Makes ownership and staffing visible.

### Project Hierarchy Graph

- React Flow graph for project structure
- Project, manager, tech lead, team, members, and task state visualization
- Collapse/expand support
- Mini map support

Business value:

- Gives a visual map of project ownership and delivery structure.
- Useful for manager reviews and onboarding.

### Tasks

- Personal task workspace
- List and Kanban views
- Status and priority filters
- Task create/edit/delete
- Project-specific task tab
- Project-created tasks are locked to that project
- Task workflow summary cards: open, due today, overdue, high priority

Business value:

- Connects execution to people and projects.
- Helps users focus on work assigned to them.
- Helps managers inspect project work without leaving project context.

### Notes

- Personal notes workspace
- Tiptap rich-text editor
- Autosave
- Tags
- Optional project linkage
- Project notes tab shows notes owned by the current user and linked to that project

Business value:

- Gives users private thinking space close to work.
- Keeps project-related notes discoverable without making all notes shared by default.

### Activity Feed

- Workspace activity feed
- Project activity feed
- Activity formatter for readable messages
- Backend-generated safe navigation links
- Non-navigable rows for inaccessible or deleted targets

Business value:

- Shows what changed recently.
- Provides historical context without making every event a notification.

### True Notifications

- User-specific notification table
- Header bell uses notification APIs instead of global activity
- Unread count
- Mark one read
- Mark all read
- Initial triggers:
  - user added to project
  - user removed from project
  - user becomes project manager
  - user becomes project tech lead
  - task assignment infrastructure

Business value:

- Reduces noise.
- Shows users only actionable updates meant for them.
- Prepares for comments and mentions.

### Insights And Charts

- Recharts-based chart primitives
- Dashboard insights
- Project insights page
- My task insights page
- Project detail health charts
- Measured chart containers to avoid invalid chart dimensions

Business value:

- Converts operational data into portfolio and workload views.
- Helps managers scan status instead of reading every list.

### Project Health And Risk Signals

- Project health scoring API
- Portfolio health API
- Health statuses: healthy, attention, at risk
- Explainable score reasons
- Signals include:
  - missing manager
  - missing tech lead
  - missing team
  - missing members
  - overdue tasks
  - high-priority open tasks
  - stale project movement
  - no tasks tracked
- Dashboard health card
- Project detail health panel

Business value:

- Shows which projects need attention.
- Turns project data into decision support.
- Helps managers prioritize follow-up.

### Blog And Content Workspace

- Internal blog management
- Post create/edit/delete
- Publish/unpublish
- Public blog rendering

Business value:

- Supports internal editorial workflow and public communication.

### Permissions And Roles

Current roles include:

- admin
- manager
- tech lead
- employee
- HR
- viewer

Permissions are enforced on the backend and reflected in the UI.

Business value:

- Protects sensitive operations.
- Keeps role-specific workflows controlled.

### Server Hardening

- Request IDs
- Request logging
- Rate limiting for auth/search/public content
- Central error middleware foundation
- PostgreSQL performance indexes
- Notification failure isolation so core workflows do not fail if notification delivery fails

Business value:

- Improves reliability.
- Improves production readiness.
- Reduces risk that secondary services break primary workflows.

## Demo Flow

Recommended manager demo path:

1. Login as seeded admin.
2. Open Dashboard.
3. Show KPI cards.
4. Show Project Health card.
5. Show charts and insights.
6. Open Projects.
7. Open one project detail page.
8. Show overview, health panel, hierarchy graph, team, tasks, notes, and activity.
9. Add a project member and explain user-specific notification behavior.
10. Open My Tasks and show list/Kanban plus task summary.
11. Open My Notes and show project-linked private note behavior.
12. Open Blog workspace and public blog.

## Integration Strategy

The product should not assume every organization starts from a clean slate.

Most real customers already have some combination of:

- HRIS or employee spreadsheet
- Google Workspace or Microsoft Entra ID
- Slack or Microsoft Teams
- Jira, Linear, Asana, Trello, or GitHub Issues
- Existing project spreadsheets
- Confluence, Notion, Google Docs, or SharePoint

OrgSphere should support three adoption modes.

### 1. Clean Slate Adoption

Use when:

- small organization
- new team
- pilot workspace
- no reliable existing source of truth

Approach:

- seed/import employees
- create teams
- create projects
- start task and note workflows inside OrgSphere

### 2. Import-First Adoption

Use when:

- organization already has employee/project data
- customer wants a one-time migration

Approach:

- CSV import for employees, teams, projects, and members
- validation before import
- duplicate detection by email/project name
- import summary and error report

Near-term import candidates:

- employees by CSV
- teams by CSV
- projects by CSV
- project members by CSV
- tasks by CSV

### 3. Integration-Led Adoption

Use when:

- customer already has a mature tool stack
- OrgSphere should become a visibility layer rather than replacing every tool immediately

Approach:

- sync identity from Google/Microsoft/HRIS
- sync tasks from Jira/Linear/GitHub Issues
- sync project metadata from existing project systems
- push notifications to Slack/Teams later
- keep OrgSphere as the connected visibility and health layer

Potential integration roadmap:

- Google Workspace or Microsoft Entra ID for users
- Jira/Linear/GitHub Issues for tasks
- Slack/Microsoft Teams for notifications
- Notion/Confluence for documents later

## Data Ownership Model

Recommended source-of-truth approach:

| Data | Source Of Truth |
|---|---|
| Users | HRIS / Identity provider / OrgSphere for MVP |
| Teams | OrgSphere initially, HRIS later |
| Projects | OrgSphere or imported project system |
| Tasks | OrgSphere for MVP, external issue tracker later |
| Notes | OrgSphere |
| Activity | OrgSphere |
| Notifications | OrgSphere |
| Project health | OrgSphere-derived |

## How We Get Value Without Replacing Existing Tools

OrgSphere does not need to replace everything on day one.

It can start as:

- a visibility layer over people, teams, and projects
- a project health dashboard
- a manager operating view
- a lightweight internal workspace for teams without mature tooling

Then it can expand into:

- deeper task execution
- comments and mentions
- blockers and milestones
- capacity planning
- external integrations

This reduces adoption friction because customers can get value from visibility and health signals before migrating all execution work.

## Current Limitations

Known constraints:

- Notifications are now user-specific, but trigger coverage is still intentionally small.
- Task assignment currently defaults to the creator in the existing task creation model.
- Notes are private personal notes, not shared project documents.
- External integrations are not implemented yet.
- Import tooling is not implemented yet.
- File uploads are local and should move to object storage for multi-instance deployments.
- Redis/RabbitMQ/Kubernetes are not currently used.

## Near-Term Roadmap

Recommended next phases:

1. Harden notification trigger coverage and add task assignment to other users.
2. Add comments and mentions on tasks/projects.
3. Add blockers and milestones.
4. Add team capacity and workload planning.
5. Add CSV import for employees/projects/tasks.
6. Add external integrations after import workflows are proven.

## Demo Talking Points

- OrgSphere reduces fragmented internal context.
- It connects people, teams, projects, tasks, notes, activity, and notifications.
- Project health turns raw operational data into manager action.
- Notifications are personal and actionable, not just global activity noise.
- Activity remains useful as timeline/history.
- The product can work for clean-slate teams or integrate gradually with existing systems.
- The current architecture is modular enough to add comments, mentions, blockers, milestones, and integrations.
