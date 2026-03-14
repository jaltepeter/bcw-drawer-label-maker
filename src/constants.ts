// MTG card size: 2.5" × 3.5" (standard poker / top-loader size)
export const CARD_WIDTH_IN = 2.5
export const CARD_HEIGHT_IN = 3.5

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
