# Markdown Clipper

A browser extension that captures web content as Markdown files and saves them directly to folders on your computer. Forked from [Obsidian Web Clipper](https://github.com/obsidianmd/obsidian-clipper).

## Features

- **Save to local folders** - Select any folder on your computer using the File System Access API
- **Powerful templates** - Create custom templates with variables, filters, and triggers
- **Smart content extraction** - Automatically extracts article content, metadata, and highlights
- **94+ filters** - Transform content with text manipulation, date formatting, and more
- **URL-based triggers** - Automatically apply templates based on URL patterns or schemas

## Browser Support

**Chrome and Edge only** - This extension uses the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) which is currently only supported in Chromium-based browsers.

## Installation

### From source

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run build:chrome` to build the extension
4. Open Chrome and navigate to `chrome://extensions`
5. Enable **Developer mode**
6. Click **Load unpacked** and select the `dist` directory

## Usage

### Configure a save folder

1. Click the extension icon and go to **Settings** (gear icon)
2. In the **Save folders** section, click **Add folder**
3. Select a folder on your computer where you want to save clipped content
4. Grant permission when prompted - the extension will remember this folder

### Clip a webpage

1. Navigate to any webpage you want to save
2. Click the extension icon
3. Optionally highlight text on the page before clipping
4. Select a template and destination folder
5. Optionally enter a subfolder path (e.g., `articles` or `articles/2024`) - leave empty to save directly to the root folder
6. Click **Save** to save the markdown file

### Templates

Templates control how content is captured and formatted. Each template includes:

- **Note name** - The filename format (e.g., `{{title}}`)
- **Path** - Optional subfolder within your save folder (e.g., `articles/{{date}}`). Leave empty to save to the root. Supports variables for dynamic paths.
- **Properties** - YAML frontmatter fields
- **Note content** - The markdown body with variables

#### Variables

Use double curly braces to insert dynamic content:

- `{{title}}` - Page title
- `{{url}}` - Page URL
- `{{content}}` - Extracted article content
- `{{highlights}}` - Selected/highlighted text
- `{{author}}` - Article author
- `{{date}}` - Current date
- `{{published}}` - Article publish date
- And many more...

#### Filters

Transform variables with filters using the pipe syntax:

```
{{title|lowercase}}
{{content|markdown}}
{{date|date:"YYYY-MM-DD"}}
{{title|replace:"old":"new"}}
```

#### Triggers

Automatically apply templates based on:

- **URL match** - Simple text matching (e.g., `youtube.com`)
- **URL regex** - Regular expression patterns
- **Schema** - Structured data types (e.g., `Article`, `Recipe`)

## Build Commands

```bash
# Install dependencies
npm install

# Build for Chrome
npm run build:chrome

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Project Structure

```
src/
├── core/           # Main extension logic (popup, settings)
├── managers/       # Feature managers (templates, settings)
├── utils/          # Utilities (markdown conversion, file saving)
├── types/          # TypeScript type definitions
├── icons/          # Extension icons
└── _locales/       # Internationalization files
```

## Key Differences from Obsidian Web Clipper

| Feature | Obsidian Web Clipper | Markdown Clipper |
|---------|---------------------|------------------|
| Save destination | Obsidian vaults via URI | Any local folder |
| Browser support | Chrome, Firefox, Safari, Edge | Chrome, Edge only |
| Daily notes | Supported | Not supported |
| Obsidian URI | Required | Not used |

## Third-party Libraries

- [webextension-polyfill](https://github.com/mozilla/webextension-polyfill) - Browser compatibility
- [defuddle](https://github.com/kepano/defuddle) - Content extraction
- [turndown](https://github.com/mixmark-io/turndown) - HTML to Markdown conversion
- [dayjs](https://github.com/iamkun/dayjs) - Date parsing and formatting
- [lz-string](https://github.com/pieroxy/lz-string) - Template compression
- [lucide](https://github.com/lucide-icons/lucide) - Icons
- [mathml-to-latex](https://github.com/asnunes/mathml-to-latex) - MathML to LaTeX conversion
- [dompurify](https://github.com/cure53/DOMPurify) - HTML sanitization

## License

This project is a fork of [Obsidian Web Clipper](https://github.com/obsidianmd/obsidian-clipper). See the original repository for license information.
