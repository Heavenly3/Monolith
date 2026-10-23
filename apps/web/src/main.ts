import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import 'primeicons/primeicons.css';
import './styles.css';

import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';
import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router.ts';
import { MonolithPreset } from './theme.ts';

createApp(App)
  .use(PrimeVue, {
    theme: {
      preset: MonolithPreset,
      options: { darkModeSelector: '.app-dark', cssLayer: false },
    },
  })
  .use(ToastService)
  .use(ConfirmationService)
  .directive('tooltip', Tooltip)
  .use(router)
  .mount('#app');
