// Top-loader insert size: 2.68" × 3.58" (fits centered in a toploader)
export const CARD_WIDTH_IN = 2.68
export const CARD_HEIGHT_IN = 3.58

/** Max size of the icon in the icon area (inches); scales with canvas. */
export const MAX_ICON_SIZE_IN = 1.81

/** Distance from the bottom of the card to the bottom of the (square) icon, in inches. */
export const ICON_BOTTOM_MARGIN_IN = 1.6

/** Default/reference DPI; layout is designed at this resolution. */
export const DPI = 300
export const CARD_WIDTH_PX = Math.round(CARD_WIDTH_IN * DPI)
export const CARD_HEIGHT_PX = Math.round(CARD_HEIGHT_IN * DPI)

/** DPI values offered for export. */
export const EXPORT_DPI_OPTIONS = [300, 600] as const
export type ExportDpi = (typeof EXPORT_DPI_OPTIONS)[number]

/** Border corner radius in mm when border is shown. */
export const BORDER_RADIUS_MM = 2.5

/** Pixel dimensions for export at the given DPI (same physical size). */
export function getExportDimensions(dpi: number): { width: number; height: number } {
  return {
    width: Math.round(CARD_WIDTH_IN * dpi),
    height: Math.round(CARD_HEIGHT_IN * dpi),
  }
}
