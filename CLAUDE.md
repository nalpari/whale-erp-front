# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev       # Start development server on http://localhost:3000
pnpm build     # Production build
pnpm start     # Start production server
pnpm lint      # Run ESLint (flat config, eslint.config.mjs)
```

## Tech Stack

- **Next.js 16** with App Router (`src/app/`)
- **React 19** with React Compiler enabled (`next.config.ts`)
- **Tailwind CSS 4** via `@tailwindcss/postcss`
- **TypeScript** in strict mode

## Architecture

### Rich Text Editor (Tiptap)

The app includes a Notion-style rich text editor at `/editor`:

- **Editor.tsx**: Main editor component using Tiptap with extensions for images, links, tables, and code blocks (syntax highlighting via lowlight)
- **SlashCommand extension**: Custom Tiptap extension that triggers on "/" character, renders a command palette via tippy.js popup
- **slash-commands.ts**: Defines available slash commands (headings, lists, quotes, code blocks, etc.)
- **SlashCommand.tsx**: React component for the command palette UI with keyboard navigation

To add new slash commands, add items to the `slashCommands` array in `slash-commands.ts`.

## Key Configuration

- Path alias: `@/*` maps to `./src/*`
- Tailwind 4 uses CSS `@import "tailwindcss"` syntax and `@theme` directive for custom properties
- ESLint uses flat config with Next.js core-web-vitals and TypeScript presets
