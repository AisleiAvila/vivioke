---
name: frontend-patterns
description: "Reusable frontend patterns for React/Vite apps: loading/error/empty states, async actions, forms, accessibility, and responsive layout practices."
risk: safe
source: self
date_added: "2026-03-06"
---

# Frontend Patterns

## Purpose

Use this skill when building or refactoring UI in frontend screens, especially for async data, user feedback, and robust interaction states.

## Core Rules

1. Always handle `loading`, `error`, `empty`, and `success` states.
2. Never hide errors from the user.
3. Disable actions while requests are in progress.
4. Keep layout responsive from 360px mobile to desktop.
5. Prefer reusable UI primitives over ad-hoc duplicated markup.

## Data State Pattern (React)

```tsx
if (isError) {
  return <ErrorState message="Falha ao carregar dados" onRetry={refetch} />;
}

if (isLoading && !data) {
  return <SkeletonList rows={6} />;
}

if (!data || data.length === 0) {
  return (
    <EmptyState
      title="Sem resultados"
      actionLabel="Recarregar"
      onAction={refetch}
    />
  );
}

return <DataList items={data} />;
```

## Async Action Pattern

```tsx
<Button disabled={isSaving} onClick={onSave}>
  {isSaving ? "Salvando..." : "Salvar"}
</Button>
```

## Error UX Pattern

- Show a visible message near the failing area.
- Add `Retry` when operation is retryable.
- Keep previous valid data on background refetch.
- Log technical details only to console/telemetry.

## Forms

- Validate on blur and on submit.
- Show field-level error text.
- Keep submit button disabled when invalid or submitting.
- Prevent duplicate submissions.

## Accessibility

- Use semantic HTML first.
- Ensure keyboard navigation for all interactive controls.
- Use `aria-live="polite"` for async status updates.
- Keep sufficient color contrast in states and alerts.

## Responsive Layout

- Mobile-first approach.
- Avoid fixed pixel widths for content containers.
- Test breakpoints at `360`, `768`, `1024`, `1440`.

## Checklist

- [ ] Loading state
- [ ] Error state
- [ ] Empty state
- [ ] Retry path
- [ ] Disabled actions during async
- [ ] Keyboard accessibility
- [ ] Mobile layout verified

## When to use

Apply this skill when creating or updating pages, dialogs, lists, forms, or async flows in frontend codebases.
