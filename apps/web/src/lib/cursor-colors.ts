export const CURSOR_PALETTE = [
  '#7C3AED', // muted purple
  '#1F4E9D', // decision blue
  '#16A34A', // success green
  '#E6C100', // muted yellow (not full brand yellow — that's reserved for action items)
  '#C8302D', // danger red
  '#3D8FBC', // question blue
] as const;

export type CursorColor = (typeof CURSOR_PALETTE)[number];

export function colorForIndex(index: number): CursorColor {
  return CURSOR_PALETTE[index % CURSOR_PALETTE.length];
}
