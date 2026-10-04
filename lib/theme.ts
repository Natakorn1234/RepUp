export const accentThemes = {
  lime: { name: 'Lime', color: '#c8f36a', light: '#477c1d' },
  blue: { name: 'Blue', color: '#8fc5ff', light: '#185caa' },
  violet: { name: 'Violet', color: '#c4a7ff', light: '#7140b5' },
  orange: { name: 'Orange', color: '#ffb477', light: '#a44c0d' },
  rose: { name: 'Rose', color: '#ffa3bf', light: '#b12f5d' },
  teal: { name: 'Teal', color: '#78ddc8', light: '#147363' },
} as const;
export type AccentColor = keyof typeof accentThemes;
