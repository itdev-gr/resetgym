# Dashboard Sortable Columns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the admin dashboard clients table sortable by clicking on the **Ημ. Έναρξης**, **Ημ. Λήξης**, **Πληρωμή**, and **Πακέτο** column headers.

**Architecture:** Client-side, vanilla JS sort. Each sortable `<th>` gets a `data-sort` attribute declaring its data type (`date`, `number`, or `text`). A single click handler reads the column index from the `<th>`'s position, sorts the `<tbody>` rows in place, and toggles ascending/descending on repeat clicks. Sort state is in-memory only (resets on reload). A small caret indicator (`▲`/`▼`) shows the active column and direction.

**Tech Stack:** Astro (server-rendered HTML), vanilla JS in an inline `<script>`, Tailwind for styling.

**File touched:** `src/pages/dashboard/index.astro` only.

**Pre-implementation check:** Before Task 1, open `src/pages/dashboard/index.astro` and confirm:
1. The four target `<th>` elements exist with the Greek labels in their `<thead>`.
2. Each `<tbody>` row's cells for these columns hold human-readable text (e.g., `15/03/2026`, `€50,00`, `Premium`). If any cell wraps the value in nested elements (icons, badges), the sort script will use `cell.textContent.trim()` — that already handles nested nodes correctly. No row markup changes needed.
3. Note the **date format** in the start/end cells (DD/MM/YYYY vs YYYY-MM-DD vs DD-MM-YYYY). The plan assumes `DD/MM/YYYY`. If different, adjust the `parseDate` function in Task 2 accordingly — the change is mechanical (swap which split parts go where).
4. Note the **payment cell format** (e.g., `€50,00`, `50.00 €`, `Πληρωμένο`). The plan assumes a currency string containing digits + optional decimal — the regex `/[\d,.]+/` extracts it and `parseFloat` after normalising `,` → `.` handles it. If payment is a status string (`Πληρωμένο` / `Εκκρεμεί`), change the column's `data-sort` to `text` instead of `number`.

---

## File Structure

Single file, three changes inside it:

- `src/pages/dashboard/index.astro`
  - **Modify (`<thead>` block):** add `data-sort`, `data-sort-key`, role/aria, and an indicator `<span>` to the four target `<th>` elements.
  - **Add (bottom of file, after the existing markup):** an inline `<script>` block holding the sort logic.
  - **Modify (existing `<th>` classes):** add `cursor-pointer select-none` Tailwind utilities so users see the columns are interactive.

No new files, no new dependencies.

---

## Task 1: Mark the four target `<th>` cells as sortable

**Files:**
- Modify: `src/pages/dashboard/index.astro` — the `<thead>` row containing the column labels.

- [ ] **Step 1: Locate the `<thead>` row**

Open `src/pages/dashboard/index.astro`. Find the `<thead>` block. You will see four `<th>` elements with text `Ημ. Έναρξης`, `Ημ. Λήξης`, `Πληρωμή`, `Πακέτο` (likely surrounded by other `<th>` elements for name/actions — leave those untouched).

- [ ] **Step 2: Update those four `<th>` elements**

Replace each of the four target `<th>` elements with the version below. Keep any existing Tailwind classes that were already on the `<th>`; only **add** the four new classes (`cursor-pointer`, `select-none`, `hover:bg-gray-50`, `group`) plus the `data-sort`, `data-sort-key`, `role`, `tabindex` and `aria-sort` attributes, plus the inner `<span class="sort-indicator">` element.

Ημ. Έναρξης:

```astro
<th
  data-sort="date"
  data-sort-key="start"
  role="button"
  tabindex="0"
  aria-sort="none"
  class="cursor-pointer select-none hover:bg-gray-50 group [EXISTING_CLASSES_HERE]"
>
  Ημ. Έναρξης
  <span class="sort-indicator ml-1 inline-block w-3 text-gray-400 group-hover:text-gray-700" aria-hidden="true"></span>
</th>
```

Ημ. Λήξης:

```astro
<th
  data-sort="date"
  data-sort-key="end"
  role="button"
  tabindex="0"
  aria-sort="none"
  class="cursor-pointer select-none hover:bg-gray-50 group [EXISTING_CLASSES_HERE]"
>
  Ημ. Λήξης
  <span class="sort-indicator ml-1 inline-block w-3 text-gray-400 group-hover:text-gray-700" aria-hidden="true"></span>
</th>
```

Πληρωμή:

```astro
<th
  data-sort="number"
  data-sort-key="payment"
  role="button"
  tabindex="0"
  aria-sort="none"
  class="cursor-pointer select-none hover:bg-gray-50 group [EXISTING_CLASSES_HERE]"
>
  Πληρωμή
  <span class="sort-indicator ml-1 inline-block w-3 text-gray-400 group-hover:text-gray-700" aria-hidden="true"></span>
</th>
```

Πακέτο:

```astro
<th
  data-sort="text"
  data-sort-key="package"
  role="button"
  tabindex="0"
  aria-sort="none"
  class="cursor-pointer select-none hover:bg-gray-50 group [EXISTING_CLASSES_HERE]"
>
  Πακέτο
  <span class="sort-indicator ml-1 inline-block w-3 text-gray-400 group-hover:text-gray-700" aria-hidden="true"></span>
</th>
```

Replace `[EXISTING_CLASSES_HERE]` with whatever class string was already on that `<th>` — do not delete existing styling.

- [ ] **Step 3: Save and run the dev server**

Run: `npm run dev`
Expected: Astro starts, no template errors. Open `http://localhost:4321/dashboard` and verify the four headers now show a pointer cursor on hover. The indicator `<span>` is empty so nothing visible changes yet.

- [ ] **Step 4: Commit**

```bash
git add src/pages/dashboard/index.astro
git commit -m "feat(dashboard): mark date/payment/package headers as sortable"
```

---

## Task 2: Add the sort script

**Files:**
- Modify: `src/pages/dashboard/index.astro` — append a `<script>` block.

- [ ] **Step 1: Add the script at the bottom of the file**

After the closing tag of whatever wraps the table (or simply at the very end of the `.astro` file, after all markup), add this exact block:

```astro
<script>
  // Sort the clients table by clicking on column headers.
  // Triggers on any <th data-sort="..."> within the dashboard table.

  type SortType = "date" | "number" | "text";
  type SortDir = "asc" | "desc";

  function parseDate(raw: string): number {
    // Expected format: DD/MM/YYYY. Returns ms-since-epoch (or NaN for empty cells).
    const m = raw.trim().match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (!m) return Number.NEGATIVE_INFINITY;
    const [, d, mo, y] = m;
    const year = y.length === 2 ? 2000 + Number(y) : Number(y);
    return new Date(year, Number(mo) - 1, Number(d)).getTime();
  }

  function parseNumber(raw: string): number {
    // Pull the first numeric run out, normalise EU decimal comma to dot.
    const m = raw.replace(/\s/g, "").match(/-?[\d.,]+/);
    if (!m) return Number.NEGATIVE_INFINITY;
    const normalised = m[0].replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
    const n = parseFloat(normalised);
    return Number.isNaN(n) ? Number.NEGATIVE_INFINITY : n;
  }

  function cellValue(cell: HTMLTableCellElement, type: SortType): number | string {
    const raw = cell.textContent?.trim() ?? "";
    if (type === "date") return parseDate(raw);
    if (type === "number") return parseNumber(raw);
    return raw.toLocaleLowerCase("el-GR");
  }

  function compare(a: number | string, b: number | string, dir: SortDir): number {
    if (a < b) return dir === "asc" ? -1 : 1;
    if (a > b) return dir === "asc" ? 1 : -1;
    return 0;
  }

  function attachSorting(table: HTMLTableElement): void {
    const headerRow = table.tHead?.rows[0];
    const tbody = table.tBodies[0];
    if (!headerRow || !tbody) return;

    const headers = Array.from(headerRow.cells);

    headers.forEach((th, colIndex) => {
      if (!th.dataset.sort) return;
      const type = th.dataset.sort as SortType;

      const sortBy = () => {
        // Reset other headers' aria-sort + indicator.
        headers.forEach((other) => {
          if (other === th) return;
          other.setAttribute("aria-sort", "none");
          const ind = other.querySelector(".sort-indicator");
          if (ind) ind.textContent = "";
        });

        const current = th.getAttribute("aria-sort");
        const dir: SortDir = current === "ascending" ? "desc" : "asc";
        th.setAttribute("aria-sort", dir === "asc" ? "ascending" : "descending");
        const indicator = th.querySelector(".sort-indicator");
        if (indicator) indicator.textContent = dir === "asc" ? "▲" : "▼";

        const rows = Array.from(tbody.rows);
        rows.sort((rowA, rowB) => {
          const cellA = rowA.cells[colIndex];
          const cellB = rowB.cells[colIndex];
          if (!cellA || !cellB) return 0;
          return compare(cellValue(cellA, type), cellValue(cellB, type), dir);
        });

        // Re-append in sorted order. Appending an existing node moves it.
        const frag = document.createDocumentFragment();
        rows.forEach((r) => frag.appendChild(r));
        tbody.appendChild(frag);
      };

      th.addEventListener("click", sortBy);
      th.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          sortBy();
        }
      });
    });
  }

  // Attach to every table on the dashboard that has at least one sortable header.
  document.querySelectorAll<HTMLTableElement>("table").forEach((table) => {
    if (table.querySelector("th[data-sort]")) attachSorting(table);
  });
</script>
```

- [ ] **Step 2: Verify it loads**

Run: `npm run dev` (if not still running, otherwise just reload the page).
Expected: No console errors. Open DevTools → Console; it should be clean.

- [ ] **Step 3: Manually test each column**

Visit `http://localhost:4321/dashboard` and click each of the four headers. After each click verify, with at least 3 rows of data visible:

- **Ημ. Έναρξης**: rows reorder by start date, oldest first. Click again → newest first. Indicator shows `▲` then `▼`.
- **Ημ. Λήξης**: same, by end date.
- **Πληρωμή**: rows reorder by payment amount, smallest first → largest first.
- **Πακέτο**: rows reorder alphabetically by package name (Greek collation) ascending → descending.

Also verify: clicking a second column resets the first column's indicator to empty and its `aria-sort` to `none`.

Keyboard test: `Tab` to a sortable header (focus ring should appear), press `Enter` → sort triggers. Press `Space` → direction flips.

If any column sorts wrong, check the format assumption from the pre-implementation check and adjust the matching parser (`parseDate` or `parseNumber`) in the script.

- [ ] **Step 4: Commit**

```bash
git add src/pages/dashboard/index.astro
git commit -m "feat(dashboard): sort clients table by header click"
```

---

## Task 3: Final visual + regression pass

**Files:** none modified — verification only.

- [ ] **Step 1: Confirm no regressions in other dashboard interactions**

On `/dashboard`, confirm the following still work after sorting:
- Row click / row link to client detail (if present) still navigates correctly after the rows have been reordered.
- Any delete / edit buttons on rows still target the correct client (they should — sorting only reorders DOM nodes, it doesn't reassign data).
- The page header, filters (if any), and pagination (if any) are untouched.

- [ ] **Step 2: Check mobile rendering**

In DevTools, switch to a mobile viewport (≤ 640px wide). Confirm the headers don't visibly break — the indicator `<span>` should sit inline next to the label. If the table is hidden / replaced with a card view on mobile, no action needed (sort handlers simply won't fire).

- [ ] **Step 3: Build the production bundle**

Run: `npm run build`
Expected: build completes without TypeScript or template errors. The inline `<script>` is TypeScript-annotated and Astro will type-check it.

If the build fails complaining about the `type SortType` syntax (some Astro setups don't allow TS in inline scripts without `lang="ts"`), either:
- add `lang="ts"` to the `<script>` opening tag, **or**
- strip the four `type` aliases and the `as SortType` / `as SortDir` casts (the JS still works untyped).

- [ ] **Step 4: Final commit if anything was tweaked**

If you had to switch to `lang="ts"` or strip types, commit that:

```bash
git add src/pages/dashboard/index.astro
git commit -m "chore(dashboard): adjust sort script for Astro TS handling"
```

If nothing changed in this task, no commit needed.

---

## Done criteria

- All four headers (`Ημ. Έναρξης`, `Ημ. Λήξης`, `Πληρωμή`, `Πακέτο`) sort ascending on first click and descending on second.
- Only one column shows an active sort indicator at a time.
- Headers are keyboard-focusable and operable via Enter/Space.
- `npm run build` passes.
- No console errors on `/dashboard`.
