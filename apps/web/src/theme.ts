// PrimeVue theme: Aura with the gold, leather and parchment tones of the bot
// (apps/bot/src/ui/theme.ts). The dashboard is always dark.
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';

const gold = {
  50: '#fbf7e9',
  100: '#f5ebc4',
  200: '#ecd88c',
  300: '#e0c155',
  400: '#d4ad36',
  500: '#c9a227',
  600: '#a8821c',
  700: '#86641a',
  800: '#6e511b',
  900: '#5d441b',
  950: '#35250b',
};

const leather = {
  0: '#ffffff',
  50: '#f6f3ef',
  100: '#e8e1d8',
  200: '#cfc3b4',
  300: '#b0a08c',
  400: '#8f7d68',
  500: '#6f5f4e',
  600: '#54473a',
  700: '#3e342b',
  800: '#2a231d',
  900: '#1c1713',
  950: '#120e0b',
};

export const MythcorePreset = definePreset(Aura, {
  semantic: {
    primary: gold,
    colorScheme: {
      dark: {
        surface: leather,
        primary: {
          color: '{primary.500}',
          contrastColor: '#1c1713',
          hoverColor: '{primary.400}',
          activeColor: '{primary.300}',
        },
        highlight: {
          background: 'color-mix(in srgb, {primary.500}, transparent 84%)',
          focusBackground: 'color-mix(in srgb, {primary.500}, transparent 76%)',
          color: '{primary.200}',
          focusColor: '{primary.100}',
        },
      },
    },
  },
});
