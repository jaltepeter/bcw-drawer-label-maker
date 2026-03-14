import { CARD_WIDTH_PX, BORDER_RADIUS_MM, CARD_WIDTH_IN, getExportDimensions } from './constants'
import { getIconUrl, type IconId } from './icons'
import { getCardLayout } from './layout'

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
  /** Card background color (e.g. #ffffff). */
  backgroundColor?: string
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

/** Force the label font to load so canvas can use it (browsers don't load @font-face until used in DOM). */
async function waitForFonts(): Promise<void> {
  if (!document.fonts?.load) return
  await document.fonts.load('700 1em "Beleren2016 Small Caps"')
  await document.fonts.ready
}

const fontSize = 84
const textFontFamily = '"Beleren2016 Small Caps", serif'

/** Draw card layout into a context (for preview or export). Scale 1 = CARD_WIDTH_PX × CARD_HEIGHT_PX. */
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
  const radiusPx = (BORDER_RADIUS_MM / 25.4) * (width / CARD_WIDTH_IN)
  const cardRadius = Math.min(radiusPx, width / 2, height / 2)
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(0, 0, width, height, cardRadius)
  ctx.fillStyle = options.backgroundColor ?? '#ffffff'
  ctx.fill()
  ctx.clip()
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

  // Text centered in the band from bottom of icon to bottom of card
  const textAreaTop = layout.iconZoneHeight
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

  ctx.restore()

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

/** PNG CRC-32 (used for chunk checksum). */
function pngCrc32(data: Uint8Array): number {
  let crc = 0xffffffff
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  for (let i = 0; i < data.length; i++) crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

/** Insert pHYs chunk (pixels per meter) so the PNG reports correct DPI when opened in Cricut/print software. */
async function pngWithDpi(blob: Blob, dpi: number): Promise<Blob> {
  const buf = await blob.arrayBuffer()
  const arr = new Uint8Array(buf)
  const signatureAndIhdrLen = 8 + 4 + 4 + 13 + 4 // signature + IHDR chunk (length+type+data+crc)
  if (arr.length < signatureAndIhdrLen) return blob // too small (e.g. test mock), skip
  const ppm = Math.round(dpi / 0.0254) // pixels per meter
  const physData = new Uint8Array(9)
  const view = new DataView(physData.buffer)
  view.setUint32(0, ppm, false)
  view.setUint32(4, ppm, false)
  physData[8] = 1 // unit: meter
  const chunkType = new TextEncoder().encode('pHYs')
  const chunkPayload = new Uint8Array(4 + 9) // type + data
  chunkPayload.set(chunkType, 0)
  chunkPayload.set(physData, 4)
  const crc = pngCrc32(chunkPayload)
  const chunk = new Uint8Array(4 + 4 + 9 + 4) // length + type + data + crc
  const chunkView = new DataView(chunk.buffer)
  chunkView.setUint32(0, 9, false)
  chunk.set(chunkType, 4)
  chunk.set(physData, 8)
  chunkView.setUint32(17, crc, false)
  const out = new Uint8Array(signatureAndIhdrLen + chunk.length + arr.length - signatureAndIhdrLen)
  out.set(arr.subarray(0, signatureAndIhdrLen), 0)
  out.set(chunk, signatureAndIhdrLen)
  out.set(arr.subarray(signatureAndIhdrLen), signatureAndIhdrLen + chunk.length)
  return new Blob([out], { type: 'image/png' })
}

/** Create an offscreen canvas, draw the card, return as PNG blob with DPI set so physical size is exact. */
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
  const rawBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
      'image/png',
      1
    )
  })
  return pngWithDpi(rawBlob, dpi)
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
