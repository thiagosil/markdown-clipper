# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Markdown Clipper is a browser extension (Chrome/Edge only) that captures web content as Markdown files and saves them directly to local folders via the File System Access API. Forked from Obsidian Web Clipper.

## Build & Test Commands

```bash
npm install              # Install dependencies
npm run dev              # Watch mode development (Chrome)
npm run build:chrome     # Production build for Chrome
npm test                 # Run tests once
npm run test:watch       # Run tests in watch mode
```

Other scripts: `dev:firefox`, `dev:safari`, `build:firefox`, `build:safari`, `build` (all browsers).

## Architecture

### Extension Entry Points

- **`src/background.ts`** - Service worker managing extension lifecycle, tab listeners, and content script injection
- **`src/content.ts`** - Content script running on web pages for content extraction and highlighting
- **`src/core/popup.ts`** - Main popup UI handling template selection, rendering, and file saving
- **`src/core/settings.ts`** - Settings page for configuration

### Template Engine

The custom template engine processes `{{variable|filter}}` syntax:

1. **`src/utils/tokenizer.ts`** - Lexical analysis
2. **`src/utils/parser.ts`** - Parses tokens into AST
3. **`src/utils/renderer.ts`** - Renders AST to output
4. **`src/utils/filters/`** - 94+ filter implementations (each in its own file)

### Key Utilities

- **`src/utils/storage-utils.ts`** - Chrome storage API wrapper with `Settings` interface
- **`src/utils/folder-file-saver.ts`** - File System Access API integration for saving to local folders
- **`src/utils/content-extractor.ts`** - Article extraction using defuddle library
- **`src/utils/markdown-converter.ts`** - HTML to Markdown via turndown

### Types

All core interfaces defined in **`src/types/types.ts`**: `Template`, `FolderConfig`, `Settings`, `ExtractedContent`, etc.

## Testing

Tests use vitest and are co-located with source files as `*.test.ts`. Filter tests are in `src/utils/filters/`.

```bash
npm test                          # Run all tests
npm run test:watch                # Watch mode
npx vitest run parser.test.ts    # Run specific test file
```

## Adding a New Filter

1. Create `src/utils/filters/{name}.ts` implementing `FilterFunction`
2. Create `src/utils/filters/{name}.test.ts`
3. Register in `src/utils/filters.ts`

## Internationalization

40+ languages in `src/_locales/`. English source strings in `src/_locales/en/messages.json`.

```bash
npm run update-locales    # Sync translations
npm run check-strings     # Find unused i18n strings
npm run add-locale        # Add new language
```

## Code Style

- TypeScript with strict mode
- Tabs for indentation (4 spaces)
- Single quotes, semicolons required
- ESLint configured in `.eslintrc.json`
