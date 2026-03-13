import './style.css'
import { CARD_WIDTH_PX, CARD_HEIGHT_PX } from './constants'
import { ICON_IDS, getIconUrl, type IconId } from './icons'
import type { CardOptions } from './card'
import { renderCardToBlob, downloadCard, drawCardPreview } from './card'

const PREVIEW_SCALE = 0.3
const previewWidth = Math.round(CARD_WIDTH_PX * PREVIEW_SCALE)
const previewHeight = Math.round(CARD_HEIGHT_PX * PREVIEW_SCALE)

let state: CardOptions = {
  iconId: 'w',
  line1: '',
  line2: '',
  line3: '',
  showLine2: true,
  showLine3: true,
}

function getEl<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id)
  if (!el) throw new Error(`#${id} not found`)
  return el as T
}

function renderPreview() {
  const canvas = getEl<HTMLCanvasElement>('preview')
  canvas.width = previewWidth
  canvas.height = previewHeight
  drawCardPreview(canvas, getDisplayOptions()).catch(console.error)
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

function setupDownload() {
  const btn = getEl<HTMLButtonElement>('download-btn')
  btn.addEventListener('click', async () => {
    btn.disabled = true
    try {
      const blob = await renderCardToBlob(state)
      const name = [state.line1 || 'label', state.iconId].filter(Boolean).join('-').replace(/\s+/g, '-') || 'drawer-label'
      downloadCard(blob, `${name}.png`)
    } catch (e) {
      console.error(e)
    } finally {
      btn.disabled = false
    }
  })
}

function init() {
  const app = getEl('app')
  app.innerHTML = `
    <header class="header">
      <h1>Drawer Label Maker</h1>
      <p class="subtitle">MTG-size labels for BCW catalog · 2.5″ × 3.5″ @ 300 DPI</p>
    </header>
    <main class="main">
      <section class="controls">
        <fieldset class="fieldset">
          <legend>Icon</legend>
          <div id="icon-picker" class="icon-picker"></div>
        </fieldset>
        <fieldset class="fieldset">
          <legend>Text (up to 3 lines)</legend>
          <input type="text" id="line1" class="text-input" maxlength="32" />
          <div id="line2-row" class="text-line-row">
            <label class="line-toggle">
              <input type="checkbox" id="show-line2" checked />
              <span>Show line 2</span>
            </label>
            <input type="text" id="line2" class="text-input" maxlength="32" />
          </div>
          <div id="line3-row" class="text-line-row">
            <label class="line-toggle">
              <input type="checkbox" id="show-line3" checked />
              <span>Show line 3</span>
            </label>
            <input type="text" id="line3" class="text-input" maxlength="32" />
          </div>
        </fieldset>
        <button type="button" id="download-btn" class="download-btn">Download PNG</button>
      </section>
      <section class="preview-section">
        <p class="preview-label">Preview</p>
        <canvas id="preview" class="preview-canvas" width="${previewWidth}" height="${previewHeight}"></canvas>
      </section>
    </main>
    <footer class="credits">
      <p class="credits-title">Credits</p>
      <ul class="credits-list">
        <li><strong>Label font (Mplantin):</strong> <a href="https://github.com/AlexandreArpin/mtg-font" target="_blank" rel="noopener noreferrer">mtg-font</a> by Alexandre Arpin (MIT).</li>
        <li><strong>Mana symbols (icons):</strong> <a href="https://github.com/andrewgioia/mana" target="_blank" rel="noopener noreferrer">Mana</a> by Andrew Gioia.</li>
      </ul>
    </footer>
  `
  setupIconPicker()
  setupTextInputs()
  setupDownload()
  renderPreview()
}

init()
