/**
 * PaginationManager for pdfme Designer.
 *
 * Keeps the full schema array in memory but only exposes a "chunk"
 * of pages at a time so the Designer DOM stays lightweight.
 */

const DEFAULT_CHUNK_SIZE = 1

export class PaginationManager {
  /** @type {Array<any>} Full schemas array (all pages) */
  #allSchemas

  /** @type {object} Reference to the original template (basePdf, etc.) */
  #baseTemplate

  /** @type {number} How many pages per chunk */
  #chunkSize

  /** @type {number} Current chunk index (0-based) */
  #currentChunk

  /** @type {number} Actual number of pages currently in the active chunk region */
  #currentChunkLen

  /**
   * @param {object}  template   – The complete pdfme template
   * @param {number} [chunkSize] – Pages per chunk (default 10)
   */
  constructor(template, chunkSize = DEFAULT_CHUNK_SIZE) {
    this.#baseTemplate = template
    this.#allSchemas = [...template.schemas]
    this.#chunkSize = chunkSize
    this.#currentChunk = 0
    this.#currentChunkLen = Math.min(chunkSize, template.schemas.length)
  }

  /* ── Getters ────────────────────────────────────────── */

  get totalPages() {
    return this.#allSchemas.length
  }

  get totalChunks() {
    return Math.max(1, Math.ceil(this.totalPages / this.#chunkSize))
  }

  get currentChunkIndex() {
    return this.#currentChunk
  }

  get chunkSize() {
    return this.#chunkSize
  }

  /** True when the document is small enough that pagination is unnecessary */
  get isSingleChunk() {
    return this.totalPages <= this.#chunkSize
  }

  /** 1-based page range of the current chunk (for display) */
  get currentRange() {
    const start = this.#currentChunk * this.#chunkSize + 1
    const end = Math.min(start + this.#chunkSize - 1, this.totalPages)
    return { start, end }
  }

  /* ── Chunk helpers ──────────────────────────────────── */

  /** Returns the schemas slice for the current chunk */
  getCurrentChunkSchemas() {
    const start = this.#currentChunk * this.#chunkSize
    const end = start + this.#chunkSize
    return this.#allSchemas.slice(start, end)
  }

  /** Builds a template containing only the current chunk's schemas */
  getChunkedTemplate() {
    return {
      ...this.#baseTemplate,
      schemas: this.getCurrentChunkSchemas(),
    }
  }

  /** Builds the full template with ALL schemas (for save / PDF generation) */
  getFullTemplate() {
    return {
      ...this.#baseTemplate,
      schemas: [...this.#allSchemas],
    }
  }

  getOutputTemplate(currentDesignerSchemas) {
    if (Array.isArray(currentDesignerSchemas)) {
      this.syncFromDesigner(currentDesignerSchemas)
    }

    const fullTemplate = this.getFullTemplate()
    const dedup = this.deduplicateNames(fullTemplate.schemas)

    if (!dedup) {
      return { template: fullTemplate, renamed: [] }
    }

    return {
      template: {
        ...fullTemplate,
        schemas: dedup.schemas,
      },
      renamed: dedup.renamed,
    }
  }

  applyOutputTemplate(template) {
    if (!template || !Array.isArray(template.schemas)) return

    this.#baseTemplate = { ...template, schemas: [...template.schemas] }
    this.#allSchemas = [...template.schemas]

    const newTotalChunks = Math.max(1, Math.ceil(this.#allSchemas.length / this.#chunkSize))
    if (this.#currentChunk >= newTotalChunks) {
      this.#currentChunk = newTotalChunks - 1
    }

    const schemas = this.getCurrentChunkSchemas()
    this.#currentChunkLen = schemas.length
  }

  /* ── Navigation ─────────────────────────────────────── */

  /**
   * Persist the Designer's current schemas back into the full array
   * before navigating away from the chunk.
   *
   * @param {Array<any>} designerSchemas – schemas currently in the Designer
   */
  syncFromDesigner(designerSchemas) {
    const start = this.#currentChunk * this.#chunkSize
    // Replace the entire current chunk region (using tracked length)
    this.#allSchemas.splice(start, this.#currentChunkLen, ...designerSchemas)
    this.#currentChunkLen = designerSchemas.length
  }

  /**
   * Navigate to a specific chunk index.
   * Returns the chunked template ready for `designer.updateTemplate()`,
   * or `null` if the index is out of range.
   *
   * @param {number}    chunkIndex
   * @param {Array<any>} currentDesignerSchemas – to sync before navigating
   * @returns {object|null}
   */
  goToChunk(chunkIndex, currentDesignerSchemas) {
    if (chunkIndex < 0 || chunkIndex >= this.totalChunks) return null

    // Sync edits from the current chunk
    this.syncFromDesigner(currentDesignerSchemas)

    this.#currentChunk = chunkIndex
    const schemas = this.getCurrentChunkSchemas()
    this.#currentChunkLen = schemas.length
    return { ...this.#baseTemplate, schemas }
  }

  /** Convenience: go to next chunk */
  next(currentDesignerSchemas) {
    return this.goToChunk(this.#currentChunk + 1, currentDesignerSchemas)
  }

  /** Convenience: go to previous chunk */
  prev(currentDesignerSchemas) {
    return this.goToChunk(this.#currentChunk - 1, currentDesignerSchemas)
  }

  /**
   * Jump directly to a specific page (1-based). Navigates to the chunk
   * that contains the requested page.
   *
   * @param {number}     pageNumber
   * @param {Array<any>} currentDesignerSchemas
   * @returns {object|null}
   */
  goToPage(pageNumber, currentDesignerSchemas) {
    if (!Number.isFinite(pageNumber) || pageNumber < 1 || pageNumber > this.totalPages) return null
    const targetChunk = Math.floor((pageNumber - 1) / this.#chunkSize)
    if (targetChunk === this.#currentChunk) return null
    return this.goToChunk(targetChunk, currentDesignerSchemas)
  }

  /**
   * Replace the template's basePdf (paper size / margins / orientation). The
   * change is applied to every page in the document. Existing schema
   * coordinates are preserved.
   *
   * @param {object}     newBasePdf              – { width, height, padding: [top, right, bottom, left] }
   * @param {Array<any>} currentDesignerSchemas  – latest schemas from the Designer
   * @returns {object} the current chunked template with the new basePdf, ready for designer.updateTemplate()
   */
  updateBasePdf(newBasePdf, currentDesignerSchemas) {
    // Persist current edits before switching basePdf
    this.syncFromDesigner(currentDesignerSchemas)
    this.#baseTemplate = { ...this.#baseTemplate, basePdf: newBasePdf }
    return this.getChunkedTemplate()
  }

  /**
   * Change how many pages are loaded per chunk. Keeps the currently-viewed
   * first page roughly in view by adjusting the current chunk index.
   *
   * @param {number}     newSize
   * @param {Array<any>} currentDesignerSchemas
   * @returns {object|null} the new chunked template, or null if size unchanged/invalid
   */
  setChunkSize(newSize, currentDesignerSchemas) {
    if (!Number.isFinite(newSize) || newSize <= 0 || newSize === this.#chunkSize) return null

    // Persist current edits before re-chunking
    this.syncFromDesigner(currentDesignerSchemas)

    // Preserve the first page of the current chunk in the new layout
    const firstPageIndex = this.#currentChunk * this.#chunkSize

    this.#chunkSize = newSize
    this.#currentChunk = Math.floor(firstPageIndex / newSize)

    const schemas = this.getCurrentChunkSchemas()
    this.#currentChunkLen = schemas.length
    return { ...this.#baseTemplate, schemas }
  }

  /**
   * Call this after the user adds/removes pages inside the Designer so the
   * manager stays in sync. It replaces the current chunk region and
   * recalculates totals automatically.
   *
   * @param {Array<any>} designerSchemas
   * @returns {boolean} true if the number of pages in the chunk changed
   */
  refreshFromDesigner(designerSchemas) {
    const start = this.#currentChunk * this.#chunkSize
    const oldLen = this.#currentChunkLen
    this.#allSchemas.splice(start, oldLen, ...designerSchemas)
    this.#currentChunkLen = designerSchemas.length
    return designerSchemas.length !== oldLen
  }

  /**
   * Remove a page from the document by 1-based page number.
   * Useful when the native Designer "delete page" is disabled (e.g. the
   * Designer only has a single page loaded because chunkSize === 1).
   *
   * @param {number} pageNumber – 1-based page number to delete
   * @returns {object|null} new chunked template ready for designer.updateTemplate(), or null if invalid
   */
  removePage(pageNumber) {
    if (!Number.isFinite(pageNumber) || pageNumber < 1 || pageNumber > this.totalPages) return null
    // Never leave the document with zero pages
    if (this.totalPages <= 1) return null

    this.#allSchemas.splice(pageNumber - 1, 1)

    // Clamp currentChunk if the document shrank past it
    const newTotalChunks = Math.max(1, Math.ceil(this.#allSchemas.length / this.#chunkSize))
    if (this.#currentChunk >= newTotalChunks) {
      this.#currentChunk = newTotalChunks - 1
    }

    const schemas = this.getCurrentChunkSchemas()
    this.#currentChunkLen = schemas.length
    return { ...this.#baseTemplate, schemas }
  }

  /* ── Name deduplication ─────────────────────────────── */

  /**
   * Collect every schema element name across ALL pages.
   * @returns {Set<string>}
   */
  getAllNames() {
    const names = new Set()
    for (const page of this.#allSchemas) {
      if (!Array.isArray(page)) continue
      for (const el of page) {
        if (el?.name) names.add(el.name)
      }
    }
    return names
  }

  #getDuplicateBaseName(name) {
    return name.replace(/(?:_\d+|_r[a-z0-9]{8})$/, '')
  }

  #generateDuplicateSuffix() {
    const timePart = Date.now().toString(36).slice(-4)
    const randomPart = Math.random().toString(36).slice(2, 6)
    return `r${timePart}${randomPart}`
  }

  #buildUniqueDuplicateName(baseName, usedNames) {
    let candidate = `${baseName}_${this.#generateDuplicateSuffix()}`
    while (usedNames.has(candidate)) {
      candidate = `${baseName}_${this.#generateDuplicateSuffix()}`
    }
    return candidate
  }

  #deduplicateSchemas(schemas) {
    const usedNames = new Set()
    let hadDuplicates = false
    const renamed = []

    const fixed = schemas.map((page) => {
      if (!Array.isArray(page)) return page
      return page.map((el) => {
        if (!el?.name) return el
        let name = el.name

        if (usedNames.has(name)) {
          const baseName = this.#getDuplicateBaseName(name)
          const candidate = this.#buildUniqueDuplicateName(baseName, usedNames)
          renamed.push(`${name} → ${candidate}`)
          name = candidate
          hadDuplicates = true
        }

        usedNames.add(name)
        return name === el.name ? el : { ...el, name }
      })
    })

    return hadDuplicates ? { schemas: fixed, renamed } : null
  }

  /**
   * Check the given schemas (current chunk) for duplicate names against
   * the rest of the document. Returns a new schemas array with any
   * duplicates renamed, or `null` if no changes were needed.
   *
   * @param {Array<any>} chunkSchemas
   * @returns {{ schemas: Array<any>, renamed: string[] } | null}
   */
  deduplicateNames(chunkSchemas) {
    return this.#deduplicateSchemas(chunkSchemas)
  }

  /**
   * All-in-one handler for Designer's onChangeTemplate.
   * Syncs page changes, handles overflow when the user adds pages beyond
   * the current chunk size (auto-navigating to the chunk containing the
   * newly added page), and deduplicates names.
   *
   * @param {Array<any>} designerSchemas – template.schemas from the Designer
   * @returns {{
   *   pagesChanged: boolean,
   *   dedup: { schemas: Array<any>, renamed: string[] } | null,
   *   overflow: { targetChunk: number, template: object, addedCount: number } | null
   * }}
   */
  handleTemplateChange(designerSchemas) {
    const start = this.#currentChunk * this.#chunkSize
    const oldLen = this.#currentChunkLen

    // Persist edits + added/removed pages into the full array
    this.#allSchemas.splice(start, oldLen, ...designerSchemas)
    const pagesChanged = designerSchemas.length !== oldLen

    // Overflow: the user added pages beyond what fits in the current chunk.
    // Move the view to the chunk containing the last added page so the user
    // sees the page they just created and the pagination stays consistent.
    let overflow = null
    if (designerSchemas.length > this.#chunkSize) {
      const addedCount = designerSchemas.length - oldLen
      const lastNewPageIndex = start + designerSchemas.length - 1
      const targetChunk = Math.floor(lastNewPageIndex / this.#chunkSize)

      this.#currentChunk = targetChunk
      const schemas = this.getCurrentChunkSchemas()
      this.#currentChunkLen = schemas.length
      overflow = {
        targetChunk,
        template: { ...this.#baseTemplate, schemas },
        addedCount: Math.max(addedCount, 1),
      }
    } else {
      this.#currentChunkLen = designerSchemas.length
    }

    const dedup = null

    return { pagesChanged, dedup, overflow }
  }
}
