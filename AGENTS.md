# Repository Guidelines

## Project Structure & Module Organization
This is a pnpm workspace monorepo with three Next.js apps under `apps/` and shared packages under `packages/`.

- `apps/ai`: AI English learning app, Next.js App Router source in `apps/ai/src`, static assets in `apps/ai/public`, DB migrations in `apps/ai/migrations`.
- `apps/admin`: Admin dashboard, source in `apps/admin/src`.
- `apps/blog`: MDX blog, routes in `apps/blog/src/app`, content in `apps/blog/content/posts/*.mdx`.
- `packages/db`, `packages/lib`, `packages/ui`: shared TypeScript utilities, UI primitives, and database helpers (source in `packages/*/src`).

## Build, Test, and Development Commands
Use `pnpm` from the repo root.

- `pnpm install`: install workspace dependencies.
- `pnpm --filter @gavinfelix/ai dev`: run the AI app on port 3002.
- `pnpm --filter saas dev`: run the admin app on port 3001.
- `pnpm --filter blog dev`: run the blog on port 3000.
- `pnpm --filter <app> build`: build a single app.
- `pnpm --filter <app> lint`: run ESLint for the app.

There is no repo-wide test command configured; add a script before relying on CI.

## Coding Style & Naming Conventions
- TypeScript + React 19 with Next.js App Router; keep files in `src/app` for routes and `src/components` or `src/features` for UI.
- Use 2-space indentation, `PascalCase` for components (`ChatMessage.tsx`), and `camelCase` for functions and variables.
- Tailwind CSS is used for styling; prefer utility classes over custom CSS.
- Linting uses Next.js ESLint configs (`eslint.config.mjs` in each app).

## Testing Guidelines
There are minimal tests today (example: `apps/ai/src/lib/ai/models.test.ts`). If you add tests, keep them close to the module under test and introduce a runnable script (e.g., `pnpm --filter @gavinfelix/ai test`).

## Commit & Pull Request Guidelines
Git history follows a conventional pattern like `type(scope): summary` (e.g., `docs(blog): add new post`). Use short, imperative summaries and meaningful scopes.

For PRs, include:
- A clear description of the change and affected apps/packages.
- Linked issues or context (if applicable).
- Screenshots or short clips for UI changes.
- Notes about env var additions or migrations.

## Configuration & Secrets
The AI app requires environment variables (see `apps/ai/ENV.md`). Store secrets in `apps/ai/.env.local` and avoid committing them.
