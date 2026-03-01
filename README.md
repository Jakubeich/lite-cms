<p align="center">
  <img src="./assets/logo.svg" alt="LiteCMS Logo" width="120" />
</p>

<h1 align="center">LiteCMS</h1>

<p align="center">
  <strong>Lightweight inline editing CMS for React applications</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@litecms/core"><img src="https://img.shields.io/npm/v/@litecms/core?color=blue&label=%40litecms%2Fcore" alt="npm @litecms/core"></a>
  <a href="https://www.npmjs.com/package/@litecms/react"><img src="https://img.shields.io/npm/v/@litecms/react?color=blue&label=%40litecms%2Freact" alt="npm @litecms/react"></a>
  <a href="https://github.com/jakubeich/litecms/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@litecms/core" alt="License"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0+-blue" alt="TypeScript"></a>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#examples">Examples</a>
</p>

---

## Overview

LiteCMS is a lightweight, modular content management system designed for React applications. It enables **inline editing** directly on your website — no separate admin panel needed. Perfect for portfolios, landing pages, blogs, and any content-driven site.

```tsx
// Just wrap your text in <Editable> and it becomes editable
<h1>
  <Editable field="hero.title" defaultValue="Welcome to my site" />
</h1>
```

When admin mode is enabled, users can click on any editable field and modify content directly on the page. Changes are saved automatically to your storage backend.

---

## Features

- **Inline Editing** — Edit content directly on the page, no admin panel needed
- **Lightweight** — Core package is only ~9KB minified
- **Pluggable Storage** — Use JSON files, Redis, Prisma, or build your own adapter
- **i18n Ready** — Built-in support for multi-language content
- **Text Formatting** — Support for `**bold**`, `<b>`, `<strong>` tags
- **React 18/19** — Full support for latest React versions
- **TypeScript** — 100% type-safe with full type definitions
- **Customizable** — Flexible styling and configuration options
- **Secure** — Password protection, session management

---

## Installation

```bash
# npm
npm install @litecms/core @litecms/react

# yarn
yarn add @litecms/core @litecms/react

# pnpm
pnpm add @litecms/core @litecms/react
```

### Requirements

- React 18.0+ or React 19.0+
- Node.js 18+

---

## Quick Start

### 1. Set up the Provider

Wrap your app with `LiteCMSProvider`:

```tsx
// app/providers.tsx
"use client";

import { LiteCMSProvider } from "@litecms/react";

// Simple in-memory adapter for development
const simpleAdapter = {
  content: new Map<string, any>(),

  async get(field: string) {
    return this.content.get(field) || null;
  },

  async getAll() {
    return Object.fromEntries(this.content);
  },

  async set(field: string, value: string) {
    const data = {
      id: field,
      field,
      value,
      updatedAt: new Date().toISOString(),
    };
    this.content.set(field, data);
    return data;
  },

  async delete(field: string) {
    this.content.delete(field);
  },
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LiteCMSProvider config={{ adapter: simpleAdapter }}>
      {children}
    </LiteCMSProvider>
  );
}
```

### 2. Use Editable Components

```tsx
// components/Hero.tsx
import { Editable } from "@litecms/react";

export function Hero() {
  return (
    <section>
      <h1>
        <Editable
          field="hero.title"
          defaultValue="Welcome to My Site"
          as="span"
        />
      </h1>
      <p>
        <Editable
          field="hero.description"
          defaultValue="This is an editable description"
        />
      </p>
    </section>
  );
}
```

### 3. Enable Edit Mode

```tsx
import { useCMSContext } from "@litecms/react";

function AdminToggle() {
  const { state, dispatch } = useCMSContext();

  return (
    <button onClick={() => dispatch({ type: "SET_EDIT_MODE", payload: !state.isEditMode })}>
      {state.isEditMode ? "Exit Edit Mode" : "Edit"}
    </button>
  );
}
```

---

## Documentation

### Packages

| Package | Description | Size |
|---------|-------------|------|
| [`@litecms/core`](https://www.npmjs.com/package/@litecms/core) | Core types, utilities, text formatting | ~9KB |
| [`@litecms/react`](https://www.npmjs.com/package/@litecms/react) | React components and hooks | ~6KB |

### `<Editable>` Component

The main component for inline editing.

```tsx
import { Editable } from "@litecms/react";

<Editable
  // Required
  field="unique.field.key"      // Unique identifier for this content

  // Optional
  defaultValue="Fallback text"  // Shown when no content exists
  as="span"                     // HTML element: "span" | "div" | "p" | "h1"-"h6"
  className="my-class"          // CSS class name
  style={{ color: "red" }}      // Inline styles
  locale="en"                   // i18n locale suffix (stores as "field_en")
  placeholder="Click to edit"   // Placeholder text when empty
  multiline={false}             // Allow line breaks (Enter key)

  // Formatting
  enableFormatting={true}       // Parse **bold**, <b>, <strong> tags

  // Styling (edit mode indicators)
  outlineStyle="dashed"         // "solid" | "dashed" | "dotted" | "none"
  outlineColor="#8b5cf6"        // Border color when editable
  focusColor="#3b82f6"          // Border color when focused

  // Callbacks
  onChange={(value) => {}}      // Called when content changes
/>
```

### `useCMS()` Hook

Access CMS content and methods.

```tsx
import { useCMS } from "@litecms/react";

function MyComponent() {
  const {
    getContent,      // (field: string) => string | null
    updateContent,   // (field: string, value: string) => Promise<void>
    isLoading,       // boolean
  } = useCMS();

  // Get content
  const title = getContent("hero.title");

  // Update content
  await updateContent("hero.title", "New Title");
}
```

### `useCMSContext()` Hook

Full access to CMS state and dispatch.

```tsx
import { useCMSContext } from "@litecms/react";

function MyComponent() {
  const {
    state,           // { content, isLoading, error, isEditMode }
    auth,            // { isAdmin }
    getContent,      // (field: string) => string | null
    updateContent,   // (field: string, value: string) => Promise<void>
    deleteContent,   // (field: string) => Promise<void>
    dispatch,        // Dispatch actions
  } = useCMSContext();

  // Toggle edit mode
  dispatch({ type: "SET_EDIT_MODE", payload: true });

  // Set admin status
  dispatch({ type: "SET_ADMIN", payload: true });
}
```

---

## Storage Adapters

LiteCMS uses adapters for content persistence. Implement the `StorageAdapter` interface:

```typescript
import type { StorageAdapter, ContentData } from "@litecms/core";

interface StorageAdapter {
  get(field: string): Promise<ContentData | null>;
  getAll(): Promise<Record<string, ContentData>>;
  set(field: string, value: string): Promise<ContentData>;
  delete(field: string): Promise<void>;
}

interface ContentData {
  id: string;
  field: string;
  value: string;
  updatedAt: string;
  updatedBy?: string;
}
```

### Example: API Adapter (Next.js)

```typescript
// lib/cms-adapter.ts
import type { StorageAdapter, ContentData } from "@litecms/core";

export function createAPIAdapter(apiUrl: string): StorageAdapter {
  return {
    async get(field) {
      const res = await fetch(`${apiUrl}?field=${encodeURIComponent(field)}`);
      if (!res.ok) return null;
      return res.json();
    },

    async getAll() {
      const res = await fetch(apiUrl);
      return res.json();
    },

    async set(field, value) {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, value }),
      });
      return res.json();
    },

    async delete(field) {
      await fetch(`${apiUrl}?field=${encodeURIComponent(field)}`, {
        method: "DELETE",
      });
    },
  };
}
```

### Example: Redis Adapter (Upstash)

```typescript
// lib/redis-adapter.ts
import { Redis } from "@upstash/redis";
import type { StorageAdapter, ContentData } from "@litecms/core";

export function createRedisAdapter(redis: Redis): StorageAdapter {
  const PREFIX = "cms:";

  return {
    async get(field) {
      return await redis.get<ContentData>(`${PREFIX}${field}`);
    },

    async getAll() {
      const keys = await redis.keys(`${PREFIX}*`);
      const result: Record<string, ContentData> = {};
      for (const key of keys) {
        const data = await redis.get<ContentData>(key);
        if (data) result[data.field] = data;
      }
      return result;
    },

    async set(field, value) {
      const data: ContentData = {
        id: field,
        field,
        value,
        updatedAt: new Date().toISOString(),
      };
      await redis.set(`${PREFIX}${field}`, data);
      return data;
    },

    async delete(field) {
      await redis.del(`${PREFIX}${field}`);
    },
  };
}
```

---

## Text Formatting

LiteCMS supports simple text formatting that renders in view mode:

| Syntax | Output | Description |
|--------|--------|-------------|
| `**text**` | **text** | Markdown bold |
| `<bold>text</bold>` | **text** | Custom bold tag |
| `<b>text</b>` | **text** | HTML b tag |
| `<strong>text</strong>` | **text** | HTML strong tag |

```tsx
// In edit mode, user types: "Hello **world**!"
// In view mode, renders as: Hello <strong>world</strong>!
```

### Parsing Utilities

```typescript
import { parseSimpleFormatting, hasFormatting } from "@litecms/core";

// Check if text has formatting
hasFormatting("Hello **world**"); // true
hasFormatting("Plain text");      // false

// Parse into segments
parseSimpleFormatting("Hello **world**!");
// Returns:
// [
//   { type: "text", content: "Hello " },
//   { type: "strong", content: "world" },
//   { type: "text", content: "!" }
// ]
```

---

## Multi-language (i18n)

Use the `locale` prop to store content per language:

```tsx
// Stores as "hero.title_en"
<Editable field="hero.title" locale="en" defaultValue="Welcome" />

// Stores as "hero.title_cs"
<Editable field="hero.title" locale="cs" defaultValue="Vítejte" />
```

Retrieve localized content:

```tsx
const { getContent } = useCMS();

// Get English version
const titleEn = getContent("hero.title_en");

// Get Czech version
const titleCs = getContent("hero.title_cs");
```

---

## Examples

### Next.js App Router Setup

```tsx
// app/layout.tsx
import { Providers } from "./providers";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

```tsx
// app/providers.tsx
"use client";

import { LiteCMSProvider } from "@litecms/react";

const adapter = {
  // ... your adapter implementation
};

export function Providers({ children }) {
  return (
    <LiteCMSProvider config={{ adapter }}>
      {children}
    </LiteCMSProvider>
  );
}
```

### Repeatable Content (Arrays)

Store and manage lists like projects, skills, etc:

```tsx
import { useCMS } from "@litecms/react";

interface Project {
  id: string;
  title: string;
  description: string;
}

function Projects() {
  const { getContent, updateContent } = useCMS();

  // Get projects from CMS
  const stored = getContent("projects.list");
  const projects: Project[] = stored ? JSON.parse(stored) : [];

  // Add project
  const addProject = (project: Project) => {
    const updated = [...projects, project];
    updateContent("projects.list", JSON.stringify(updated));
  };

  // Remove project
  const removeProject = (id: string) => {
    const updated = projects.filter(p => p.id !== id);
    updateContent("projects.list", JSON.stringify(updated));
  };

  return (
    <div>
      {projects.map(project => (
        <div key={project.id}>
          <h3>{project.title}</h3>
          <p>{project.description}</p>
        </div>
      ))}
    </div>
  );
}
```

### Protected Admin Mode

```tsx
"use client";

import { useState } from "react";
import { useCMSContext } from "@litecms/react";

function AdminLogin() {
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const { dispatch } = useCMSContext();

  const handleLogin = async () => {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      setIsAdmin(true);
      dispatch({ type: "SET_EDIT_MODE", payload: true });
    }
  };

  if (isAdmin) {
    return (
      <button onClick={() => {
        setIsAdmin(false);
        dispatch({ type: "SET_EDIT_MODE", payload: false });
      }}>
        Logout
      </button>
    );
  }

  return (
    <div>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Admin password"
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
```

---

## API Reference

### @litecms/core

#### Types

```typescript
// Content data structure
interface ContentData {
  id: string;
  field: string;
  value: string;
  updatedAt: string;
  updatedBy?: string;
}

// Storage adapter interface
interface StorageAdapter {
  get(field: string): Promise<ContentData | null>;
  getAll(): Promise<Record<string, ContentData>>;
  set(field: string, value: string): Promise<ContentData>;
  delete(field: string): Promise<void>;
}

// CMS configuration
interface CMSConfig {
  adapter?: StorageAdapter;
  apiUrl?: string;
  debug?: boolean;
}

// Formatted text segment
interface FormattedSegment {
  type: "text" | "strong" | "em" | "code" | string;
  content: string;
  className?: string;
}
```

#### Utilities

```typescript
// Text formatting
parseSimpleFormatting(text: string): FormattedSegment[]
hasFormatting(text: string): boolean

// General utilities
generateId(): string
getTimestamp(): string
debounce<T>(fn: T, delay: number): T
throttle<T>(fn: T, interval: number): T
slugify(text: string): string
```

### @litecms/react

#### Components

```tsx
// Main editable component
<Editable
  field: string
  defaultValue?: string
  as?: "span" | "div" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  className?: string
  style?: CSSProperties
  locale?: string
  placeholder?: string
  multiline?: boolean
  enableFormatting?: boolean
  outlineStyle?: "solid" | "dashed" | "dotted" | "none"
  outlineColor?: string
  focusColor?: string
  onChange?: (value: string) => void
/>

// Provider component
<LiteCMSProvider config={CMSConfig}>
  {children}
</LiteCMSProvider>
```

#### Hooks

```typescript
// Content operations
useCMS(): {
  getContent: (field: string) => string | null
  updateContent: (field: string, value: string) => Promise<void>
  isLoading: boolean
}

// Full context access
useCMSContext(): {
  state: CMSState
  auth: AuthState
  getContent: (field: string) => string | null
  updateContent: (field: string, value: string) => Promise<void>
  deleteContent: (field: string) => Promise<void>
  dispatch: Dispatch<CMSAction>
}

// Edit mode
useEditMode(): {
  isEditMode: boolean
  setEditMode: (value: boolean) => void
  toggleEditMode: () => void
}
```

---

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 90+ |
| Firefox | 90+ |
| Safari | 14+ |
| Edge | 90+ |

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

```bash
# Clone the repository
git clone https://github.com/jakubeich/litecms.git
cd litecms

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run development mode
pnpm dev
```

### Project Structure

```
lite-cms/
├── packages/
│   ├── core/          # @litecms/core - Types & utilities
│   └── react/         # @litecms/react - React components
├── apps/
│   └── demo/          # Demo application
├── turbo.json         # Turborepo config
└── pnpm-workspace.yaml
```

---

## Roadmap

- [x] Core types and utilities
- [x] React components (Editable)
- [x] Text formatting support
- [x] i18n (multi-language)
- [ ] Rich text editor (Tiptap)
- [ ] Media management
- [ ] Repeatable fields UI
- [ ] Version history
- [ ] Real-time collaboration

---

## License

MIT © [Jakub Mitrega](https://github.com/jakubeich)

---

<p align="center">
  Made with ❤️ for the React community
</p>
