# Frontend Guideline Document for codeguide-quora-clone

This document explains how the frontend of the `codeguide-quora-clone` project is built, organized, and maintained. It’s written in everyday language so anyone—technical or not—can understand how the interface works, how it’s styled, and how to extend it.

## 1. Frontend Architecture

### Technologies and Frameworks
- **Next.js (App Router)**: Our core framework. It handles page routing, server-side rendering (SSR), and static site generation (SSG). This ensures fast load times and good SEO for public questions and answers.
- **TypeScript**: Adds type safety across the entire codebase, reducing bugs when passing data between components or working with the API.
- **React**: Provides the component model for building reusable UI pieces.
- **Radix UI & shadcn/ui**: A collection of unstyled, accessible UI primitives and higher-level components. We use these building blocks to create dialogs, cards, buttons, and more, all styled with Tailwind.
- **Tailwind CSS v4**: A utility-first CSS framework for rapid, consistent styling. It keeps our styles predictable and easy to maintain.
- **Next.js API Routes**: Hosts our backend endpoints alongside the frontend. Routes like `/api/questions` or `/api/answers` live here.
- **Better Auth**: Manages user authentication and session handling on both client and server sides.
- **Drizzle ORM + PostgreSQL**: While technically part of the backend, the type-safe database layer influences how the frontend fetches and validates data.
- **Docker**: Ensures the same environment from development through production, simplifying deployment and scaling.

### Why This Architecture Works
- **Scalability**: Modular components and file-based routing let us add new pages, features, or sections without touching existing code.
- **Maintainability**: TypeScript and clear folder structures make it easy to onboard new developers and track down bugs.
- **Performance**: SSR and SSG for public content, automatic code splitting, and optimized builds mean faster page loads and better user experience.

## 2. Design Principles

### Usability
- Clear layouts and predictable interface patterns (e.g., question cards in feeds, modals for asking questions).
- Minimal clicks to perform common actions like upvoting, responding, or navigating profiles.

### Accessibility
- All interactive components (buttons, dialogs, inputs) come from Radix UI/shadcn/ui and include proper ARIA attributes.
- High color contrast and keyboard navigation support by default.
- Semantic HTML tags and `alt` text on images ensure screen-reader friendliness.

### Responsiveness
- Mobile-first design: every page and component adapts to different screen sizes.
- Fluid grid and flexbox layouts via Tailwind utilities (`flex`, `grid`, `sm:`, `md:`, `lg:` prefixes).

These principles guide how we build and style components, ensuring a consistent experience on any device or for any user.

## 3. Styling and Theming

### Approach and Methodology
- **Utility-first (Tailwind CSS)**: Rather than writing large CSS files, we compose small, single-purpose utility classes directly in our JSX. This keeps styles co-located with markup and reduces context switching.
- **Component Tokens**: We define reusable Tailwind custom properties (colors, spacing scales) in `tailwind.config.js` for consistency.

### Theming
- We use CSS variables and Tailwind’s theming plugin to switch color modes or fine-tune palette values. This allows a light/dark switch or future theme variations without rewriting component styles.

### Style Style
- **Design Style**: Modern flat design. Clean lines, generous whitespace, and subtle shadows for depth (e.g., question cards).

### Color Palette
| Role           | Hex Code   | Usage                         |
| -------------- | ---------- | ----------------------------- |
| Primary        | #0052CC    | Buttons, links, interactive highlights |
| Secondary      | #172B4D    | Headers, footers, background overlays |
| Accent         | #36B37E    | Success messages, tags        |
| Neutral Light  | #F4F5F7    | Page backgrounds              |
| Neutral Dark   | #091E42    | Main text                    |
| Error          | #DE350B    | Error messages, form states   |
| Warning        | #FFAB00    | Warnings and cautions         |

### Typography
- **Font Family**: "Inter", a versatile, legible sans-serif font.
- **Scale**: Base font size of 16px, with heading sizes from 1.25rem (H4) up to 2rem (H1).

## 4. Component Structure

### Organization
- **/app**: Next.js App Router folder for pages, layouts, and API routes.
- **/components/ui**: Generic, reusable UI primitives (Button, Card, Dialog) from shadcn/ui.
- **/components/qna**: Feature-driven components (QuestionCard, AnswerList, VoteButtons, AskQuestionForm).

### Best Practices
- One component per file, with `ComponentName.tsx` and optional `ComponentName.test.tsx` for tests.
- Index files (`index.ts`) re-export components for clean imports (e.g., `import { QuestionCard } from 'components/qna';`).
- Co-locate styles (via Tailwind classes) and tests with the component to keep related code together.

### Benefits of Component-Based Design
- **Reusability**: Build once, use everywhere (e.g., the same Card can display a question, answer, or notification).
- **Maintainability**: Isolate changes to a single component without affecting the rest of the app.
- **Readability**: Clear boundaries between UI pieces make it easier to reason about page structure.

## 5. State Management

### Data Fetching and Server State
- **Server Components** (Next.js): Fetch data for questions, answers, and user info on the server side whenever possible.
- **Client Hooks**: For interactive views (e.g., real-time vote counts), we rely on React’s `useState` and `useEffect` or a simple SWR-like pattern to revalidate.

### Session and Auth State
- Managed by **Better Auth**, which exposes a hook (e.g., `useSession`) that provides current user information.
- Session data is fetched at the root layout and passed down via React Context, so every component can check if the user is logged in.

### Local UI State
- Handled with React’s built-in hooks (`useState`, `useReducer`) or the Context API for cross-component states (like opening/closing modals).

## 6. Routing and Navigation

### File-Based Routing (Next.js App Router)
- **Pages**: Each folder and `page.tsx` file under `/app` becomes a route (`/sign-in`, `/dashboard`, `/question/[id]`).
- **Layouts**: `layout.tsx` files wrap pages with common UI (nav bars, footers).
- **Dynamic Routes**: Bracket notation (`[id]`) for question pages or profile pages (`/profile/[username]`).

### Navigation Patterns
- **next/link** for client-side transitions.
- **shadcn/ui Menu** and **Radix UI Tabs** for sub-navigation (e.g., switching between “Questions” and “Answers” on a profile page).
- **Breadcrumbs** or “Back to Feed” links to help users orient themselves.

## 7. Performance Optimization

- **Server-Side Rendering (SSR) & Static Site Generation (SSG)**: Public pages (question lists, profiles) are pre-rendered for speed and SEO.
- **Code Splitting**: Next.js automatically splits code per page. We also use dynamic imports (`next/dynamic`) for less-critical components (e.g., rich-text editor).
- **Image Optimization**: Use `next/image` for automatic resizing and webp conversion.
- **Tailwind Purge**: Strips unused CSS classes in production, keeping CSS bundles small.
- **Standalone Build + Docker**: Produces a minimal runtime image, reducing cold-start times in cloud environments.

## 8. Testing and Quality Assurance

### Unit and Integration Tests
- **Jest** + **React Testing Library** for component and utility function tests.
- Write tests alongside components (`ComponentName.test.tsx`).

### End-to-End (E2E) Tests
- **Playwright** or **Cypress** to simulate user journeys (sign-up, ask a question, vote).
- Focus on critical flows: authentication, posting questions/answers, voting, profile updates.

### Linting and Formatting
- **ESLint** with TypeScript and React plugins to catch code issues early.
- **Prettier** for consistent code style.
- **TypeScript Strict Mode** to enforce explicit types and avoid `any`.

### Continuous Integration (CI)
- Every push triggers lint, type check, and tests. Fail fast to prevent regressions.

## 9. Conclusion and Overall Frontend Summary

The `codeguide-quora-clone` frontend combines Next.js, TypeScript, Radix UI, shadcn/ui, and Tailwind CSS to deliver a modern, fast, and scalable Q&A platform. With a clear component structure, utility-first styling, and built-in performance optimizations, it’s easy to maintain and extend. Our design principles—usability, accessibility, responsiveness—ensure a quality experience for every user. Testing, linting, and strict typing keep the code reliable.

Unique strengths of this setup include:
- **Server Components** for SEO-friendly content.
- **Drizzle ORM’s** type-safe contract, which guides frontend data handling.
- **Modular UI primitives** from Radix and shadcn/ui.
- **Utility-first styling** with Tailwind for speed and consistency.

With these guidelines in hand, any team member can confidently build new features—like tagging, search, or advanced voting—while keeping the app stable and user-friendly.