# Report Builder — Current Features & Capabilities

> Complete reference of everything a user can do in the BrandFox Report Builder today.

---

## 1. Top Toolbar

The persistent header bar gives access to all global actions.

| Control | What it does |
|---|---|
| **Hamburger (☰)** | Collapse / expand the left panel |
| **Document name input** | Click to rename the report inline; amber dot appears when unsaved |
| **Save indicator** | Shows "Saving…" → "Saved" → "Save failed" (with error detail on hover) |
| **Resume Builder link** | Switch to the Resume Builder at `/` |
| **Save button** | Manually trigger a save to Firestore (also auto-saves 1.5 s after every change) |
| **Import** | Open the file import modal (Excel / CSV → Table or Chart) |
| **My Reports** | Open the document manager modal to switch between saved reports |
| **Share** | Generate a read-only public link for the current report |
| **DOCX** | Export the full document as a Word .docx file |
| **Export PDF** | Print-to-PDF using the browser's native print dialog (hidden print view) |
| **Properties toggle (⊞)** | Collapse / expand the right properties panel |
| **User menu** | Account info, New Report, My Reports, Sign Out |

---

## 2. Left Panel — Two Tabs

### Tab 1: Pages

Displays all pages in order plus the cover page (if enabled).

**Per-page actions (hover to reveal):**
- **Rename** — inline text edit; confirm with Enter or blur
- **Move Up / Move Down** — reorder pages in the document
- **Duplicate** — clone the page (all its blocks and shapes) and append it below
- **Delete** — removes the page (disabled when only one page exists)

**Global page actions:**
- **Add Page** — appends a new blank page
- Clicking a page name scrolls the canvas to that page and selects it

### Tab 2: Insert

Two sections for adding content:

#### Blocks (9 types — click to insert into the active page)

| Icon | Block Type | What it does |
|---|---|---|
| H | **Heading** | Section titles at H1, H2, H3 levels |
| T | **Text** | Paragraph / body copy |
| ⊞ | **Table** | Data grid with headers and rows |
| 📈 | **Chart** | Bar, line, area, pie, or donut charts |
| 📊 | **KPI Cards** | Metric cards with value, label, trend arrow |
| 🖼 | **Image** | Embedded image (URL or file upload) |
| ─ | **Divider** | Horizontal rule |
| ↕ | **Spacer** | Vertical whitespace |
| 📋 | **Table of Contents** | Auto-generated TOC listing all pages |

Quick insert at top: **"Insert Table of Contents page"** — creates a dedicated TOC page as the first page.

#### Shapes (8 types — click to place on active page)

Rectangle, Circle, Triangle, Diamond, Hexagon, Star, Line, Arrow

#### Shape Templates

Saved collections of shapes that can be re-applied to any page. Created in the Shape Editor (see Section 5).

---

## 3. Center Canvas

The scrollable canvas displays all pages in order, from top to bottom:

- **Cover Page** (if enabled) — always first; click it to select it
- **Content Pages** — numbered, titled, with full block and shape content

### Interacting with the canvas

| Action | Result |
|---|---|
| Click cover page | Selects it; opens Cover Page Editor in the right panel |
| Click a content block | Selects it; opens that block's editor in the right Properties tab |
| Click a shape | Selects it; opens Shape Editor in the right Properties tab |
| Click empty page area | Deselects current block/shape |
| Drag shape | Repositions it on the page (percentage-based coordinates) |
| Drag shape handle | Resizes it |

### Block controls (hover over a block)

- **↑ Move Up / ↓ Move Down** — reorder block within the page
- **🗑 Delete** — removes the block from the page

---

## 4. Right Panel — Four Tabs

### Tab: Properties

Context-sensitive — shows different controls depending on what is selected.

#### Cover Page Editor (when cover is selected)

- Company name
- Report title
- Subtitle
- Date
- Background color (color picker)
- Background pattern: None / Grid / Dots / Diagonal
- Logo image (URL or file upload)
- Background image (URL or file upload)
- Text color

#### Block Editors (when a content block is selected)

**Heading block**
- Content (textarea)
- Level: H1 / H2 / H3 (button group)
- Alignment: Left / Center / Right
- Color (color picker; defaults to design pack heading color)

**Text block**
- Content (multi-line textarea)
- Alignment: Left / Center / Right / Justify

**Table block** → full TableEditor
- Caption text
- Striped rows toggle
- Bordered toggle
- Column management: rename headers, add column, remove column
- Row management: add row, remove row
- Per-cell editing: content text + bold toggle
- Header background color (inherits design pack; overrideable per block)

**Chart block** → ChartEditor
- Title
- Chart type: Bar / Line / Area / Pie / Donut
- Height (50–600 px slider)
- Show legend toggle
- Show grid toggle
- Labels (one per line textarea)
- Datasets: label, color, data values (comma-separated); add / remove datasets
- Source file label (informational)

**KPI Cards block** → KpiEditor
- Title
- Column count: 2 / 3 / 4
- Accent color (color picker)
- Per-KPI item: label, value, prefix, suffix, trend (Up/Down/Neutral), trend value text
- Add / remove KPI items

**Image block**
- Image URL or file upload (drag-and-drop or click)
- Alt text
- Caption
- Width: Full / Large / Medium / Small
- Alignment: Left / Center / Right

**Divider block**
- Style: Solid / Dashed / Double
- Color (color picker)
- Thickness (1–4 px slider)

**Spacer block**
- Height (8–120 px slider)

**Table of Contents block**
- Title text
- Include page numbers toggle
- Auto-generates content from all page titles

#### Shape Editor (when a shape is selected)

- **Position**: X % and Y % (percentage of page width/height)
- **Size**: Width % and Height %
- **Fill color** + Fill opacity %
- **Stroke color** + Stroke width (px)
- **Rotation** (–180° to +180° slider)
- **Overall Opacity** (0–100% slider)
- **Corner radius** (rectangles only, 0–80 px)
- **Layer ordering**: Move Forward / Move Back (z-index control)
- **Save page shapes as template** — saves all shapes on current page as a named, reusable template

---

### Tab: Design

Controls the document's visual theme (Design Pack).

**Built-in design packs (6):**
1. Corporate Navy — navy + blue, Inter font
2. Modern Teal — teal + green, DM Sans font
3. Minimal Slate — slate grays, Inter font
4. Bold Red — red tones, DM Sans font
5. Elegant Gold — amber + brown, Georgia font
6. Professional Blue — blue spectrum, Open Sans font

Each pack defines: primary color, accent color, heading color, body text color, table header background, table header text color, KPI accent color, and font family.

**Custom packs:**
- Create a custom design pack by specifying: name, primary color, accent color, heading color, table header colors, and font family
- Saved to localStorage under `report-custom-packs`
- Deletable individually
- Applied immediately on selection

---

### Tab: Doc

Document-level settings.

**Page size:** A4 (210 × 297 mm) or US Letter (8.5 × 11 in)

**Document type:** One of 12 categories (Financial, Annual, Management, Board, Business Plan, Pitch Deck, Investor, Company Profile, Proposal, Research, Consultancy, General)

**Cover Page section:**
- Enable / disable cover page
- Company name, report title, subtitle, date
- Background color, pattern (None/Grid/Dots/Diagonal)
- Logo image upload
- Background image upload

**Header & Footer section:**
- Show/hide header (left text + right text)
- Show/hide footer (left text + right text)
- Show/hide page numbers in footer

**Watermark section (applies to ALL pages including cover):**
- Enable/disable watermark
- Text watermark content + text color
- Image watermark (URL or upload; overrides text when set)
- Opacity slider (3%–40%)
- Rotation slider (–90° to +90°)

---

### Tab: ✨ AI

AI-powered writing and analysis (requires `ANTHROPIC_API_KEY`). Streams responses in real-time.

**Four actions:**

| Action | Requires | Output |
|---|---|---|
| **Executive Summary** | Nothing (uses full report) | Narrative summary generated from all page content |
| **Table of Contents** | Nothing (uses page/heading structure) | Formatted TOC text |
| **Rewrite Text** | A text block must be selected | Improved version of the selected text block |
| **Data Insights** | A table, chart, or KPI block must be selected | Written analysis of the selected data |

**Tone selector** (visible when Rewrite Text is available):
Professional / Concise / Formal / Persuasive

**Result actions (after generation):**
- **Apply** — inserts or replaces content in the document
  - Executive Summary → prepended to first page as a text block
  - Table of Contents → inserted as a new first page
  - Rewrite → replaces selected text block's content
  - Data Insights → inserted as a new text block after the selected data block
- **Copy** — copies result text to clipboard
- **✕** — discard result and reset

---

## 5. File Import Modal

Triggered by the **Import** button in the top toolbar.

- **Supported formats:** Excel (.xlsx) and CSV (.csv)
- **Step 1:** Upload via drag-and-drop or file picker
- **Step 2:** Configure import:
  - Select sheet (if Excel with multiple sheets)
  - Preview the data
  - Choose import mode:
    - **As Table** — first row becomes column headers; creates a Table block
    - **As Chart** — first column becomes labels; each subsequent column becomes a dataset; creates a Bar Chart block by default
  - Set a caption / chart title

The imported block is inserted into the currently active page.

---

## 6. Share Modal

Triggered by the **Share** button.

- Generates a unique public share URL
- Anyone with the link can view the report (read-only)
- The shared view renders the full report but does not include editor controls
- Shared links can be deleted (revokes access)
- Share links are stored in Firestore under `sharedReports/{shareId}`

---

## 7. Export Options

### PDF Export
- Uses the browser's print dialog via `react-to-print`
- A hidden `PrintView` component renders a clean, print-optimised version
- Page dimensions match selected page size (A4 or Letter) in mm
- Design pack fonts and colors are preserved
- Editor UI, panels, and toolbars are hidden
- Watermarks are included
- Page numbers appear in the footer if enabled

### DOCX Export
- Exports via the `docx-export` library (lazy-loaded)
- Produces a Word-compatible `.docx` file
- Preserves headings, paragraphs, tables, KPI sections, and basic formatting

---

## 8. Document Management

### Auto-save
- Automatically saves 1.5 seconds after any change
- Shows "Saving…" → "Saved" in the toolbar
- On error, shows a red "Save failed: [error detail]" banner

### Manual save
- Click **Save** in the toolbar for an immediate save

### My Reports (document picker)
- Lists all saved reports sorted by last updated
- Shows document name and last-updated date
- Open an existing report → loads it into the editor
- New Report button → resets to the default template picker

### New Report
- Accessible from User Menu → New Report, or My Reports → New
- Opens the Template Picker modal

### Template Picker
Templates are grouped by category. On first load (no saved reports), the template picker opens automatically.

---

## 9. Template Picker

Opens on first use or when creating a new report. Displays report templates grouped by category (e.g., Financial, Business, Proposal, etc.).

Each template pre-fills the document with:
- A relevant design pack
- Pre-written placeholder pages
- Sample blocks (headings, text, tables, charts, KPIs)
- Appropriate cover page settings

Selecting a template replaces the current document state.

---

## 10. Page Structure & Data Model

Each document contains:
- One optional **Cover Page** (global, not a regular page)
- One or more **Content Pages**, each with:
  - Title (shown in the left panel and TOC)
  - An ordered list of **Blocks** (the content)
  - An optional list of **Shapes** (decorative overlays)
- Global settings shared across all pages:
  - Design Pack (colors + font)
  - Page Size
  - Header / Footer content
  - Watermark

Changes to the Design Pack, Header/Footer, and Watermark affect every page simultaneously. Blocks and shapes are per-page.

---

## 11. What Users Cannot Currently Do

For context, these are notable gaps relative to the planned refinement:

- No per-page background colors, gradients, or images (only cover page has a background color)
- No "Apply To: current page / selected pages / entire document" scope control
- No multi-select of blocks or pages
- No Quick Styles (one-click full document style presets)
- No Document Branding panel (logo + brand colors set once, applied everywhere)
- No floating quick-action toolbar on block selection
- No table spreadsheet features (multi-row select, fill-down, copy/paste rows)
- No callout boxes, quote blocks, status indicators, or progress bars
- No layout presets (two-column, dashboard, financial statement layouts)
- Design Pack and Document settings are in separate tabs, not a unified Design Studio
- No Basic/Advanced mode toggle — all controls are visible at once
