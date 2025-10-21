// theme/colors.ts

export type ColorsType = typeof LightColors;

export const LightColors = {
  background: '#F7F0E2', // main background
  card: '#FFFFFF', // card / modal background
  text: '#311C0C', // main text
  textSecondary: '#666666', // secondary / muted text
  accent: '#C86A2E', // brand accent / buttons
  accentHover: '#E2581C', // hover / pressed state
  border: '#E0D7C7', // borders / separators
  placeholder: '#B0A79A', // placeholders / input hints
  shadow: 'rgba(0,0,0,0.1)', // shadow color for cards / modals
  star: '#FFD700',
  star_inactive: '#rgba(185, 185, 185, 1)',
  going: '#4CAF50',
};

export const DarkColors = {
  background: '#1C1C1C', // main background
  card: '#2C2C2C', // card / modal background
  text: '#F7F0E2', // main text
  textSecondary: '#CCCCCC', // secondary / muted text
  accent: '#FF8C42', // brand accent / buttons
  accentHover: '#FF702E', // hover / pressed state
  border: '#333333', // borders / separators
  placeholder: '#999999', // placeholders / input hints
  shadow: 'rgba(0,0,0,0.5)', // shadow color for cards / modals
  star: '#FFD700',
  star_inactive: '#rgba(185, 185, 185, 1)',
  going: '#4CAF50',
};
