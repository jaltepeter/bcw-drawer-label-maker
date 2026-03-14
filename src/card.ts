import {
  CARD_WIDTH_PX,
  CARD_HEIGHT_PX,
  BORDER_RADIUS_MM,
  CARD_WIDTH_IN,
  CARD_HEIGHT_IN,
  getExportDimensions,
} from './constants'
import { getIconUrl, type IconId } from './icons'
import { getCardLayout, type CardLayout } from './layout'

export interface CardOptions {
  iconId: IconId | null
  line1: string
  line2: string
  line3: string
  showLine2?: boolean
  showLine3?: boolean
  showBorder?: boolean
  /** Export resolution (DPI). Default 300. */
  exportDpi?: number
  /** Hex colors for icon and each text line (e.g. #000000). */
  iconColor?: string
  line1Color?: string
  line2Color?: string
  line3Color?: string
}

/** Load an SVG string as an Image for drawing on canvas. */
function loadSvgAsImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load SVG'))
    }
    img.src = url
  })
}

/** Set SVG fill and stroke to a given hex color. */
function svgToColor(svg: string, color: string): string {
  const hex = color.startsWith('#') ? color : `#${color}`
  return svg
    .replace(/\bfill="[^"]*"/gi, `fill="${hex}"`)
    .replace(/\bstroke="[^"]*"/gi, `stroke="${hex}"`)
}

/** Fetch SVG from URL and load as Image (avoids canvas taint). Icon uses given color. */
async function loadSvgFromUrl(url: string, color: string): Promise<HTMLImageElement> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch icon: ${res.status}`)
  let svgText = await res.text()
  svgText = svgToColor(svgText, color)
  return loadSvgAsImage(svgText)
}

/** Fetch icon SVG and return inner content + viewBox size for embedding in card SVG. */
async function fetchIconSvgForEmbed(
  url: string,
  color: string
): Promise<{ inner: string; viewBoxSize: number }> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch icon: ${res.status}`)
  let svgText = await res.text()
  svgText = svgToColor(svgText, color)
  const viewBoxMatch = svgText.match(/viewBox=["']([^"']+)["']/i)
  let viewBoxSize = 100
  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].trim().split(/\s+/)
    if (parts.length >= 4) viewBoxSize = Math.max(1, (Number(parts[2]) + Number(parts[3])) / 2)
  }
  const inner = svgText
    .replace(/<svg[^>]*>/i, '')
    .replace(/<\/svg>\s*$/i, '')
    .trim()
  return { inner, viewBoxSize }
}

interface TextLineSpec {
  text: string
  fontSize: number
  y: number
  color: string
}

/** Compute text line specs (font size, y) for SVG export using same logic as canvas. */
function getTextLineSpecs(
  options: CardOptions,
  layout: CardLayout,
  ctx: CanvasRenderingContext2D
): TextLineSpec[] {
  const show2 = options.showLine2 !== false
  const show3 = options.showLine3 !== false
  const lines = [
    options.line1,
    show2 ? options.line2 : null,
    show3 ? options.line3 : null,
  ].filter(Boolean) as string[]
  const lineColors = [
    options.line1Color ?? '#000000',
    options.line2Color ?? '#000000',
    options.line3Color ?? '#000000',
  ]
  const height = CARD_HEIGHT_PX
  const textAreaTop = layout.textStartY
  const textAreaBottom = height - layout.padding
  const textAreaHeight = textAreaBottom - textAreaTop
  const blockHeight = lines.length * layout.lineHeight
  const startY = textAreaTop + (textAreaHeight - blockHeight) / 2
  const contentWidth = layout.contentWidth
  const specs: TextLineSpec[] = []
  ctx.font = `600 ${fontSize}px ${textFontFamily}`
  let lineY = startY
  for (let i = 0; i < lines.length; i++) {
    if (lineY + layout.lineHeight > textAreaBottom) break
    const line = lines[i]
    let font = fontSize
    let metrics = ctx.measureText(line)
    while (metrics.width > contentWidth && font > 16) {
      font -= 2
      ctx.font = `600 ${font}px ${textFontFamily}`
      metrics = ctx.measureText(line)
    }
    specs.push({ text: escapeXml(line), fontSize: font, y: lineY, color: lineColors[i] ?? '#000000' })
    lineY += layout.lineHeight
  }
  return specs
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Force the label font to load so canvas can use it (browsers don't load @font-face until used in DOM). */
async function waitForFonts(): Promise<void> {
  if (!document.fonts?.load) return
  await document.fonts.load('700 1em "Beleren2016 Small Caps"')
  await document.fonts.ready
}

const fontSize = 84
const textFontFamily = '"Beleren2016 Small Caps", serif'

/** Draw card layout into a context (for preview or export). Scale 1 = 750×1050. */
async function drawCard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: CardOptions,
  scale: number
) {
  await waitForFonts()
  const s = scale
  const layout = getCardLayout(width, height)
  ctx.clearRect(0, 0, width, height)
  const contentWidth = layout.contentWidth
  const show2 = options.showLine2 !== false
  const show3 = options.showLine3 !== false
  const lines = [
    options.line1,
    show2 ? options.line2 : null,
    show3 ? options.line3 : null,
  ].filter(Boolean) as string[]
  const hasIcon = options.iconId && getIconUrl(options.iconId as IconId)

  const iconColor = options.iconColor ?? '#000000'
  if (hasIcon && options.iconId) {
    const url = getIconUrl(options.iconId as IconId)
    const img = await loadSvgFromUrl(url, iconColor)
    ctx.drawImage(
      img,
      layout.iconX,
      layout.iconY,
      layout.iconSize,
      layout.iconSize
    )
  }

  const textAreaTop = layout.textStartY
  const textAreaBottom = height - layout.padding
  const textAreaHeight = textAreaBottom - textAreaTop
  const blockHeight = lines.length * layout.lineHeight
  const y = textAreaTop + (textAreaHeight - blockHeight) / 2

  const lineColors = [
    options.line1Color ?? '#000000',
    options.line2Color ?? '#000000',
    options.line3Color ?? '#000000',
  ]
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  const fs = fontSize * s
  ctx.font = `600 ${fs}px ${textFontFamily}`

  let lineY = y
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (lineY + layout.lineHeight > textAreaBottom) break
    ctx.fillStyle = lineColors[i] ?? '#000000'
    let font = fs
    let metrics = ctx.measureText(line)
    while (metrics.width > contentWidth && font > 16) {
      font -= 2
      ctx.font = `600 ${font}px ${textFontFamily}`
      metrics = ctx.measureText(line)
    }
    ctx.fillText(line, width / 2, lineY, contentWidth)
    lineY += layout.lineHeight
  }

  if (options.showBorder) {
    const borderWidth = Math.max(1, 3 * s)
    const half = borderWidth / 2
    const w = width - borderWidth
    const h = height - borderWidth
    const radiusPx = (BORDER_RADIUS_MM / 25.4) * (width / CARD_WIDTH_IN)
    const radius = Math.min(radiusPx, w / 2, h / 2)
    ctx.strokeStyle = '#000'
    ctx.lineWidth = borderWidth
    ctx.beginPath()
    ctx.roundRect(half, half, w, h, radius)
    ctx.stroke()
  }
}

/** Create an offscreen canvas, draw the card, return as PNG blob. */
export async function renderCardToBlob(options: CardOptions): Promise<Blob> {
  const dpi = options.exportDpi ?? 300
  const { width, height } = getExportDimensions(dpi)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2d not available')
  const scale = width / CARD_WIDTH_PX
  await drawCard(ctx, width, height, options, scale)
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
      'image/png',
      1
    )
  })
}

/** Draw preview into an existing canvas (e.g. 225×315). */
export async function drawCardPreview(
  canvas: HTMLCanvasElement,
  options: CardOptions
): Promise<void> {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const scale = canvas.width / CARD_WIDTH_PX
  await drawCard(ctx, canvas.width, canvas.height, options, scale)
}

/** Trigger download of the card as a PNG file. */
export function downloadCard(blob: Blob, filename = 'drawer-label.png') {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Font path for embedding in SVG (same as fonts.css). */
const FONT_URL_WOFF = '/fonts/Beleren2016SmallCaps-Bold.woff'

/** Fetch font and return a data URL for embedding in SVG so the font renders exactly. */
async function getEmbeddedFontDataUrl(): Promise<string> {
  const res = await fetch(FONT_URL_WOFF)
  if (!res.ok) throw new Error(`Failed to fetch font: ${res.status}`)
  const blob = await res.blob()
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read font'))
    reader.readAsDataURL(blob)
  })
}

/** Render the card as an SVG string (2.5" × 3.5" with viewBox). Preserves whitespace for Cricut. Embeds font so it renders exactly. */
export async function renderCardToSvg(options: CardOptions): Promise<string> {
  await waitForFonts()
  const fontDataUrl = await getEmbeddedFontDataUrl()
  const width = CARD_WIDTH_PX
  const height = CARD_HEIGHT_PX
  const layout = getCardLayout(width, height)
  const borderWidth = 3
  const half = borderWidth / 2
  const radiusPx = (BORDER_RADIUS_MM / 25.4) * (width / CARD_WIDTH_IN)
  const radius = Math.min(radiusPx, (width - borderWidth) / 2, (height - borderWidth) / 2)

  let iconGroup = ''
  const hasIcon = options.iconId && getIconUrl(options.iconId as IconId)
  const iconColor = options.iconColor ?? '#000000'
  if (hasIcon && options.iconId) {
    const url = getIconUrl(options.iconId as IconId)
    const { inner, viewBoxSize } = await fetchIconSvgForEmbed(url, iconColor)
    const scale = layout.iconSize / viewBoxSize
    iconGroup = `<g transform="translate(${layout.iconX},${layout.iconY}) scale(${scale})">${inner}</g>`
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2d not available')
  const textSpecs = getTextLineSpecs(options, layout, ctx)

  const textEls = textSpecs
    .map(
      (s) =>
        `<text x="${width / 2}" y="${s.y}" font-family="Beleren2016 Small Caps, serif" font-size="${s.fontSize}" font-weight="600" fill="${s.color}" text-anchor="middle" dominant-baseline="hanging">${s.text}</text>`
    )
    .join('\n    ')

  const borderRect =
    options.showBorder ?
      `<rect x="${half}" y="${half}" width="${width - borderWidth}" height="${height - borderWidth}" rx="${radius}" ry="${radius}" fill="none" stroke="#000" stroke-width="${borderWidth}"/>`
    : ''

  const fontUrlEscaped = fontDataUrl.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${CARD_WIDTH_IN}in" height="${CARD_HEIGHT_IN}in">
  <defs>
    <style>
      @font-face {
        font-family: 'Beleren2016 Small Caps';
        src: url('${fontUrlEscaped}') format('woff');
        font-weight: 700;
        font-style: normal;
      }
    </style>
  </defs>
  <rect width="${width}" height="${height}" fill="white"/>
  ${iconGroup}
  ${textEls}
  ${borderRect}
</svg>`
}

/** Trigger download of the card as an SVG file. */
export function downloadSvg(svgString: string, filename = 'drawer-label.svg') {
  const blob = new Blob([svgString], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
