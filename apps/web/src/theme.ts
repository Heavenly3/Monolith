// PrimeVue theme: Aura in the graphite and cyan of the bot (apps/bot/src/ui/theme.ts).
// The dashboard is always dark.
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';

const cyan = {
  50: '#eefbfe',
  100: '#d4f4fb',
  200: '#aee8f6',
  300: '#8fdcf0',
  400: '#73d2eb',
  500: '#5ec8e5',
  600: '#3aa9c8',
  700: '#2d86a0',
  800: '#276b80',
  900: '#24596a',
  950: '#123844',
};

const graphite = {
  0: '#ffffff',
  50: '#f2f4f6',
  100: '#dfe3e8',
  200: '#c2c9d1',
  300: '#9ba5b0',
  400: '#76818d',
  500: '#58626d',
  600: '#414952',
  700: '#2a3038',
  800: '#1a1e23',
  900: '#13161a',
  950: '#0b0d10',
};

export const MonolithPreset = definePreset(Aura, {
  semantic: {
    primary: cyan,
    colorScheme: {
      dark: {
        surface: graphite,
        primary: {
          color: '{primary.500}',
          contrastColor: '#0b0d10',
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
