# HobbyHub design

## Intent

Build a separate final-project forum where car design enthusiasts share sketches, questions, and critiques. Call it **Formline** and give it an editorial automotive design identity. A visitor should be able to understand and demo the main features in three minutes.

## Goals

- Create posts with a required title and optional body and external image URL.
- Show a feed with creation time, title, and upvote count only; sort by newest or most upvoted and search titles.
- Give each post a direct detail URL with its full content, image, comments, and an unlimited-use upvote button.
- Allow authors to edit and delete their own posts. Use anonymous Supabase Auth and row-level security for ownership.
- Provide a Supabase migration and a browser demo mode with the same app behavior so the project can be evaluated without cloud credentials.
- Deliver a CodePath-style README with an accurate feature checklist, GIF walkthrough, setup steps, and a concise Demo Day speaking outline.

## Non-goals

- Named accounts, direct image upload, reposting, video embeds, and moderation are stretch features outside this pass.
- Browser demo mode is local to one browser. Supabase is the durable multi-visitor backend once configured.

## Constraints

- Keep the new project separate from the linked `project7` Crewmates repository.
- Use the existing course stack: Vite, React, React Router, Supabase JS, and Vitest.
- Do not expose a Supabase service-role key in frontend code. Enable RLS, even though the course handout mentions disabling it; public reading and author-only writes need explicit policies.
- The supplied assignment does not include the README template URL. Follow the heading and checklist layout used by the user's Project 7 README.
- A live Supabase check requires a project URL, publishable key, enabled anonymous sign-ins, and the migration applied to that project.

## Approaches

1. **Repurpose Project 7:** reuse its components and repository. Less setup, but it would replace a working Crewmates submission and make the final-project history harder to review.
2. **Separate HobbyHub project (chosen):** reuse the stack and lessons while preserving the previous app. It needs a new repository and setup, but gives the final project its own clear submission.

## Architecture

- `src/domain/posts.js`: validation, sorting, search, date display, and ownership helpers.
- `src/data/demoRepository.js`: localStorage-backed posts, comments, user ID, and upvotes for offline demo. Seed discussions about vehicle proportions, lighting, and aerodynamics.
- `src/data/supabaseRepository.js`: equivalent operations through Supabase JS and anonymous auth.
- `src/data/repository.js`: choose demo mode only when neither Supabase setting is present; reject partial configuration.
- `src/App.jsx`: load data, route pages, and coordinate mutations.
- Pages and components: feed, create form, detail, edit form, comment composer, and shared shell.
- SQL migration: `posts` and `comments` with RLS, author-only editing, and an atomic upvote RPC available to signed-in anonymous users.

## Demo flow

Show the feed, search and sort, create a post, open its detail URL, upvote, comment, edit, then delete. The README GIF should show the browser executing this flow; the three-minute outline follows the same sequence.
