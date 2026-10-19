import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, shallowRef, type Ref } from 'vue';
import { t } from '../i18n/index.ts';
import { errorMessage } from './errors.ts';

export interface Loader<T> {
  data: Ref<T | null>;
  error: Ref<string | null>;
  loading: Ref<boolean>;
  reload: () => Promise<void>;
}

/** Loads data when the page opens and lets it reload after a change. */
export function useLoader<T>(load: () => Promise<T>): Loader<T> {
  const data = shallowRef<T | null>(null);
  const error = ref<string | null>(null);
  const loading = ref(false);

  async function reload(): Promise<void> {
    loading.value = true;
    try {
      data.value = await load();
      error.value = null;
    } catch (failure) {
      error.value = errorMessage(failure);
    } finally {
      loading.value = false;
    }
  }

  onMounted(reload);
  return { data, error, loading, reload };
}

/** Toasts for the result of an action. */
export function useNotify() {
  const toast = useToast();
  return {
    success(summary: string): void {
      toast.add({ severity: 'success', summary, life: 2500 });
    },
    failure(error: unknown, fallback?: string): void {
      toast.add({ severity: 'error', summary: errorMessage(error, fallback), life: 5000 });
    },
  };
}

/** Asks before a destructive action. Resolves to true when confirmed. */
export function useAsk() {
  const confirm = useConfirm();
  return (message: string): Promise<boolean> =>
    new Promise((resolve) => {
      confirm.require({
        message,
        header: t('web.common.areYouSure'),
        icon: 'pi pi-exclamation-triangle',
        rejectProps: { label: t('web.common.cancel'), severity: 'secondary', outlined: true },
        acceptProps: { label: t('web.common.confirm'), severity: 'danger' },
        accept: () => resolve(true),
        reject: () => resolve(false),
        onHide: () => resolve(false),
      });
    });
}
