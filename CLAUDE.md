# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**LiteCMS** — a lightweight, modular CMS library for React applications with inline editing capabilities. Built as a monorepo using pnpm workspaces and Turborepo. Designed for Next.js but framework-agnostic at core.

## Commands

```bash
pnpm install     # Install all dependencies
pnpm build       # Build all packages (respects dependency order)
pnpm dev         # Watch mode for all packages
pnpm clean       # Clean all dist folders and node_modules
```

### Per-package commands
```bash
cd packages/core && pnpm build    # Build single package
cd apps/demo && pnpm dev          # Run demo app
```

## Architecture

### Monorepo Structure
```
lite-cms/
├── packages/           # NPM packages (@litecms/*)
│   ├── core/           # Types, utilities, text formatting
│   ├── react/          # React components, hooks, context
│   ├── adapter-json/   # JSON file storage adapter
│   ├── adapter-prisma/ # Prisma database adapter
│   ├── media/          # Media upload/gallery components
│   ├── fields/         # Repeatable fields (drag & drop)
│   ├── richtext/       # Tiptap WYSIWYG editor
│   ├── i18n/           # Multi-language support
│   ├── versioning/     # Content version history
│   ├── auth/           # User roles & permissions
│   ├── publishing/     # Draft/publish workflow
│   ├── overlay/        # Visual editing overlay
│   ├── seo/            # SEO fields & preview
│   ├── collab/         # Real-time collaboration
│   └── components/     # Pre-built section components
├── apps/
│   └── demo/           # Next.js demo application
├── turbo.json          # Turborepo configuration
├── pnpm-workspace.yaml # Workspace definition
└── tsconfig.base.json  # Shared TypeScript config
```

### Package Dependencies
```
@litecms/core (no deps)
    ↓
@litecms/react (depends on core)
    ↓
@litecms/fields, @litecms/media, @litecms/richtext, etc.
```

## Core Packages

### @litecms/core

Types and utilities shared across all packages.

**Key exports:**
- `ContentData`, `StorageAdapter` — storage interfaces
- `MediaFile`, `MediaStorageAdapter` — media types
- `RepeatableItem`, `RepeatableFieldConfig` — repeatable fields
- `parseSimpleFormatting()` — text formatting parser
- `hasFormatting()` — check for formatting tags
- `debounce()`, `throttle()`, `generateId()` — utilities

**Text formatting supports:**
- `**bold**` (markdown)
- `<bold>text</bold>`, `<b>text</b>`, `<strong>text</strong>` (HTML)

### @litecms/react

React integration with context providers and editable components.

**Key exports:**
- `LiteCMSProvider` — main context provider
- `Editable` — inline editable text component
- `useCMS()` — content operations hook
- `useEditMode()` — edit mode state hook
- `useCMSContext()` — full context access

**Editable component props:**
```tsx
<Editable
  field="hero.title"           // Unique field key
  defaultValue="Hello"         // Fallback value
  as="h1"                      // HTML element
  locale="en"                  // i18n suffix (_en)
  enableFormatting={true}      // Parse **bold** etc.
  outlineStyle="dashed"        // "solid" | "dashed" | "dotted" | "none"
  outlineColor="#8b5cf6"       // Edit indicator color
  focusColor="#3b82f6"         // Focus indicator color
  multiline={false}            // Allow line breaks
  placeholder="Click to edit"  // Empty state text
/>
```

### @litecms/adapter-json

File-based JSON storage for development/simple deployments.

```tsx
import { createJSONAdapter, createAPIHandler } from "@litecms/adapter-json";

// Server-side
const adapter = createJSONAdapter({ filePath: "./data/content.json" });

// API route (Next.js)
export const { GET, POST, DELETE } = createAPIHandler(adapter);
```

## Building & Development

### Build order (handled by Turbo)
1. `@litecms/core` (no dependencies)
2. `@litecms/react` (depends on core)
3. All other packages (depend on core/react)

### Adding a new package
```bash
mkdir packages/my-package
cd packages/my-package

# Create package.json with:
# - name: "@litecms/my-package"
# - dependencies: { "@litecms/core": "workspace:*" }
# - scripts: { build, dev, clean }
```

### TypeScript configuration
All packages extend `tsconfig.base.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

### Build tool (tsup)
All packages use tsup for building:
```bash
tsup src/index.ts --format cjs,esm --dts
```

## Key Patterns

### ContentEditable cursor fix
The `Editable` component uses an **uncontrolled pattern** to prevent cursor jumping:
- Content set via `ref.current.innerText`, NOT React children
- `isEditing` state prevents re-sync during editing
- `mountedRef` tracks initialization per edit mode toggle

### Storage adapter interface
```typescript
interface StorageAdapter {
  get(field: string): Promise<ContentData | null>;
  getAll(): Promise<Record<string, ContentData>>;
  set(field: string, value: string): Promise<ContentData>;
  delete(field: string): Promise<void>;
}
```

### Locale support
Field keys support locale suffixes:
```tsx
<Editable field="title" locale="en" />  // Stores as "title_en"
<Editable field="title" locale="cs" />  // Stores as "title_cs"
```

## Integration Example

```tsx
// app/providers.tsx
import { LiteCMSProvider } from "@litecms/react";
import { createJSONAdapter } from "@litecms/adapter-json";

const adapter = createJSONAdapter({ apiUrl: "/api/cms" });

export function Providers({ children }) {
  return (
    <LiteCMSProvider config={{ adapter }}>
      {children}
    </LiteCMSProvider>
  );
}

// components/Hero.tsx
import { Editable } from "@litecms/react";

export function Hero() {
  return (
    <h1>
      <Editable field="hero.title" defaultValue="Welcome" />
    </h1>
  );
}
```

## Package Status

| Package | Status | Description |
|---------|--------|-------------|
| `@litecms/core` | ✅ Ready | Types, utilities |
| `@litecms/react` | ✅ Ready | React components |
| `@litecms/adapter-json` | ✅ Ready | JSON file storage |
| `@litecms/adapter-prisma` | 🚧 WIP | Database storage |
| `@litecms/media` | 🚧 WIP | Media management |
| `@litecms/fields` | 🚧 WIP | Repeatable fields |
| `@litecms/richtext` | 🚧 WIP | WYSIWYG editor |
| `@litecms/i18n` | 🚧 WIP | Multi-language |
| `@litecms/auth` | 🚧 WIP | User roles |
| `@litecms/versioning` | 📋 Planned | Version history |
| `@litecms/publishing` | 📋 Planned | Draft/publish |
| `@litecms/overlay` | 📋 Planned | Visual editor |
| `@litecms/seo` | 📋 Planned | SEO fields |
| `@litecms/collab` | 📋 Planned | Real-time collab |
| `@litecms/components` | 📋 Planned | Pre-built sections |

## Related Projects

- **jakubeich.github.io** — Portfolio using LiteCMS (in `../jakubeich.github.io/`)
  - Custom Redis storage adapter
  - Per-language content
  - AI chatbot with CMS integration
