import './fonts.css'
import './style.css'
import { CARD_WIDTH_PX, CARD_HEIGHT_PX, EXPORT_DPI_OPTIONS } from './constants'
import { ICON_IDS, getIconUrl, type IconId } from './icons'
import type { CardOptions } from './card'
import { renderCardToBlob, downloadCard, drawCardPreview } from './card'

const PREVIEW_SCALE = 0.3
const previewWidth = Math.round(CARD_WIDTH_PX * PREVIEW_SCALE)
const previewHeight = Math.round(CARD_HEIGHT_PX * PREVIEW_SCALE)

/** Scale for the lightbox (larger view when preview is clicked). */
const LIGHTBOX_SCALE = 0.67
const lightboxWidth = Math.round(CARD_WIDTH_PX * LIGHTBOX_SCALE)
const lightboxHeight = Math.round(CARD_HEIGHT_PX * LIGHTBOX_SCALE)

const DEFAULT_COLOR = '#000000'
const DEFAULT_BG_COLOR = '#ffffff'

let state: CardOptions = {
  iconId: 'w',
  line1: '',
  line2: '',
  line3: '',
  showLine2: true,
  showLine3: true,
  showBorder: false,
  exportDpi: 300,
  iconColor: DEFAULT_COLOR,
  line1Color: DEFAULT_COLOR,
  line2Color: DEFAULT_COLOR,
  line3Color: DEFAULT_COLOR,
  backgroundColor: DEFAULT_BG_COLOR,
}

function getEl<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id)
  if (!el) throw new Error(`#${id} not found`)
  return el as T
}

let previewRenderId = 0

function setPreviewLoading(loading: boolean) {
  const overlay = document.getElementById('preview-loading')
  if (overlay) overlay.classList.toggle('visible', loading)
}

function renderPreview() {
  const canvas = getEl<HTMLCanvasElement>('preview')
  canvas.width = previewWidth
  canvas.height = previewHeight
  const id = ++previewRenderId
  setPreviewLoading(true)
  drawCardPreview(canvas, getDisplayOptions())
    .catch(console.error)
    .finally(() => {
      if (id === previewRenderId) setPreviewLoading(false)
    })
}

function openLightbox() {
  const modal = getEl('preview-lightbox')
  const canvas = getEl<HTMLCanvasElement>('lightbox-canvas')
  canvas.width = lightboxWidth
  canvas.height = lightboxHeight
  modal.classList.add('visible')
  drawCardPreview(canvas, getDisplayOptions()).catch(console.error)
}

function closeLightbox() {
  getEl('preview-lightbox').classList.remove('visible')
}

function setupPreviewLightbox() {
  const wrap = getEl('preview-wrap')
  wrap.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('.preview-loading')) return
    openLightbox()
  })
  wrap.style.cursor = 'pointer'
  wrap.title = 'Click to view larger'

  const modal = getEl('preview-lightbox')
  modal.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('.lightbox-canvas')) return
    closeLightbox()
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox()
  })
}

function setupIconPicker() {
  const container = getEl('icon-picker')
  container.innerHTML = ''
  for (const id of ICON_IDS) {
    const option = document.createElement('div')
    option.className = 'icon-option' + (state.iconId === id ? ' selected' : '')
    const img = document.createElement('img')
    img.src = getIconUrl(id as IconId)
    img.alt = id
    img.loading = 'lazy'
    option.appendChild(img)
    option.title = id
    option.addEventListener('click', () => {
      state.iconId = id as IconId
      container.querySelectorAll('.icon-option').forEach((el) => el.classList.remove('selected'))
      option.classList.add('selected')
      renderPreview()
    })
    container.appendChild(option)
  }
}

const LINE_PLACEHOLDERS: Record<1 | 2 | 3, string> = {
  1: 'Creatures',
  2: 'A-Z',
  3: 'Common',
}

/** Options with empty lines replaced by placeholder text (for preview only). */
function getDisplayOptions(): CardOptions {
  return {
    ...state,
    line1: state.line1 || LINE_PLACEHOLDERS[1],
    line2: state.line2 || LINE_PLACEHOLDERS[2],
    line3: state.line3 || LINE_PLACEHOLDERS[3],
    showLine2: state.showLine2,
    showLine3: state.showLine3,
    showBorder: state.showBorder,
    iconColor: state.iconColor,
    line1Color: state.line1Color,
    line2Color: state.line2Color,
    line3Color: state.line3Color,
    backgroundColor: state.backgroundColor,
  }
}

function setupTextInputs() {
  const line1 = getEl<HTMLInputElement>('line1')
  line1.value = state.line1
  line1.placeholder = LINE_PLACEHOLDERS[1]
  line1.addEventListener('input', () => {
    state.line1 = line1.value
    renderPreview()
  })

  const showLine2 = getEl<HTMLInputElement>('show-line2')
  const line2 = getEl<HTMLInputElement>('line2')
  showLine2.checked = state.showLine2 !== false
  line2.value = state.line2
  line2.placeholder = LINE_PLACEHOLDERS[2]
  showLine2.addEventListener('change', () => {
    state.showLine2 = showLine2.checked
    line2.disabled = !showLine2.checked
    renderPreview()
  })
  line2.disabled = !showLine2.checked
  line2.addEventListener('input', () => {
    state.line2 = line2.value
    renderPreview()
  })

  const showLine3 = getEl<HTMLInputElement>('show-line3')
  const line3 = getEl<HTMLInputElement>('line3')
  showLine3.checked = state.showLine3 !== false
  line3.value = state.line3
  line3.placeholder = LINE_PLACEHOLDERS[3]
  showLine3.addEventListener('change', () => {
    state.showLine3 = showLine3.checked
    line3.disabled = !showLine3.checked
    renderPreview()
  })
  line3.disabled = !showLine3.checked
  line3.addEventListener('input', () => {
    state.line3 = line3.value
    renderPreview()
  })
}

function setupColorPickers() {
  const iconColor = getEl<HTMLInputElement>('icon-color')
  iconColor.value = state.iconColor ?? DEFAULT_COLOR
  iconColor.addEventListener('input', () => {
    state.iconColor = iconColor.value
    renderPreview()
  })

  const line1Color = getEl<HTMLInputElement>('line1-color')
  line1Color.value = state.line1Color ?? DEFAULT_COLOR
  line1Color.addEventListener('input', () => {
    state.line1Color = line1Color.value
    renderPreview()
  })

  const line2Color = getEl<HTMLInputElement>('line2-color')
  line2Color.value = state.line2Color ?? DEFAULT_COLOR
  line2Color.addEventListener('input', () => {
    state.line2Color = line2Color.value
    renderPreview()
  })

  const line3Color = getEl<HTMLInputElement>('line3-color')
  line3Color.value = state.line3Color ?? DEFAULT_COLOR
  line3Color.addEventListener('input', () => {
    state.line3Color = line3Color.value
    renderPreview()
  })

  const bgColor = getEl<HTMLInputElement>('bg-color')
  bgColor.value = state.backgroundColor ?? DEFAULT_BG_COLOR
  bgColor.addEventListener('input', () => {
    state.backgroundColor = bgColor.value
    renderPreview()
  })
}

function setupBorderToggle() {
  const showBorder = getEl<HTMLInputElement>('show-border')
  showBorder.checked = state.showBorder === true
  showBorder.addEventListener('change', () => {
    state.showBorder = showBorder.checked
    renderPreview()
  })
}

function setupDpiSelect() {
  const select = getEl<HTMLSelectElement>('export-dpi')
  select.value = String(state.exportDpi ?? 300)
  select.addEventListener('change', () => {
    state.exportDpi = Number(select.value) as 300 | 600
  })
}

function setupDownload() {
  const btn = getEl<HTMLButtonElement>('download-btn')
  const label = btn.dataset.label ?? 'Download PNG'
  const loadingText = btn.dataset.loading ?? 'Generating…'
  btn.addEventListener('click', async () => {
    btn.disabled = true
    btn.textContent = loadingText
    try {
      const blob = await renderCardToBlob(getDisplayOptions())
      const name = [state.line1 || 'label', state.iconId].filter(Boolean).join('-').replace(/\s+/g, '-') || 'drawer-label'
      downloadCard(blob, `${name}.png`)
    } catch (e) {
      console.error(e)
    } finally {
      btn.disabled = false
      btn.textContent = label
    }
  })
}

function init() {
  const app = getEl('app')
  app.innerHTML = `
    <span aria-hidden="true" style="position:absolute;left:-9999px;font:700 1px &quot;Beleren2016 Small Caps&quot;,serif">.</span>
    <header class="header">
      <h1>Drawer Label Maker</h1>
      <p class="subtitle">Toploader insert labels for BCW catalog · 2.68″ × 3.58″ @ 300 DPI</p>
    </header>
    <main class="main">
      <section class="controls">
        <fieldset class="fieldset">
          <legend>Icon</legend>
          <div id="icon-picker" class="icon-picker"></div>
          <div class="color-row">
            <label for="icon-color">Icon color</label>
            <input type="color" id="icon-color" value="${state.iconColor ?? DEFAULT_COLOR}" aria-label="Icon color" />
          </div>
        </fieldset>
        <fieldset class="fieldset">
          <legend>Text (up to 3 lines)</legend>
          <div class="text-line-with-color">
            <input type="text" id="line1" class="text-input" maxlength="32" />
            <input type="color" id="line1-color" value="${state.line1Color ?? DEFAULT_COLOR}" aria-label="Line 1 color" class="line-color-input" />
          </div>
          <div id="line2-row" class="text-line-row">
            <label class="line-toggle">
              <input type="checkbox" id="show-line2" checked />
              <span>Show line 2</span>
            </label>
            <div class="text-line-with-color">
              <input type="text" id="line2" class="text-input" maxlength="32" />
              <input type="color" id="line2-color" value="${state.line2Color ?? DEFAULT_COLOR}" aria-label="Line 2 color" class="line-color-input" />
            </div>
          </div>
          <div id="line3-row" class="text-line-row">
            <label class="line-toggle">
              <input type="checkbox" id="show-line3" checked />
              <span>Show line 3</span>
            </label>
            <div class="text-line-with-color">
              <input type="text" id="line3" class="text-input" maxlength="32" />
              <input type="color" id="line3-color" value="${state.line3Color ?? DEFAULT_COLOR}" aria-label="Line 3 color" class="line-color-input" />
            </div>
          </div>
        </fieldset>
        <div class="border-toggle-row">
          <label class="line-toggle">
            <input type="checkbox" id="show-border" />
            <span>Show border</span>
          </label>
        </div>
        <div class="color-row">
          <label for="bg-color">Background color</label>
          <input type="color" id="bg-color" value="${state.backgroundColor ?? DEFAULT_BG_COLOR}" aria-label="Background color" />
        </div>
        <div class="dpi-row">
          <label for="export-dpi">Export resolution</label>
          <select id="export-dpi" class="dpi-select" aria-describedby="export-dpi-desc">
            ${EXPORT_DPI_OPTIONS.map((dpi) => `<option value="${dpi}">${dpi} DPI</option>`).join('')}
          </select>
          <span id="export-dpi-desc" class="dpi-desc">Higher DPI = larger file, sharper print.</span>
        </div>
        <button type="button" id="download-btn" class="download-btn" data-label="Download PNG" data-loading="Generating…">Download PNG</button>
      </section>
      <section class="preview-section">
        <p class="preview-label">Preview</p>
        <div id="preview-wrap" class="preview-wrap">
          <canvas id="preview" class="preview-canvas" width="${previewWidth}" height="${previewHeight}"></canvas>
          <div id="preview-loading" class="preview-loading" aria-live="polite">
            <span class="preview-loading-spinner" aria-hidden="true"></span>
            <span>Loading…</span>
          </div>
        </div>
      </section>
    </main>
    <div id="preview-lightbox" class="lightbox" role="dialog" aria-modal="true" aria-label="Preview (larger)" tabindex="-1">
      <div class="lightbox-backdrop"></div>
      <canvas id="lightbox-canvas" class="lightbox-canvas" width="${lightboxWidth}" height="${lightboxHeight}"></canvas>
      <p class="lightbox-hint">Click outside or press Escape to close</p>
    </div>
    <footer class="credits">
      <p class="credits-version" aria-label="App version">v${__APP_VERSION__}${__GIT_SHA__ ? ` · ${__GIT_SHA__}` : ''}</p>
      <p class="credits-title">Credits</p>
      <ul class="credits-list">
        <li><strong>Mana symbols (icons):</strong> <a href="https://github.com/andrewgioia/mana" target="_blank" rel="noopener noreferrer">Mana</a> by Andrew Gioia.</li>
      </ul>
    </footer>
  `
  setupIconPicker()
  setupTextInputs()
  setupColorPickers()
  setupBorderToggle()
  setupDpiSelect()
  setupDownload()
  setupPreviewLightbox()
  renderPreview()
}

init()
