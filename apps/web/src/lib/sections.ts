// The dashboard is organised in sections (general, economy, levels), each
// with tabs. Tabs either open a page or the settings form of one category.
// The router and the navigation are both built from this list.
import type { Component } from 'vue';

export type SectionId = 'general' | 'economy' | 'levels';

export interface SectionTab {
  /** Part of the URL: /g/<guild>/<section>/<tab> */
  id: string;
  icon: string;
  /** Translation key of the tab label. */
  label: string;
  /** "manage" tabs (members, shop...) come before "settings" tabs. */
  kind: 'manage' | 'settings';
  /** Settings categories shown by the tab (stacked), or the page it opens. */
  categories?: string[];
  page?: () => Promise<Component | { default: Component }>;
}

export interface Section {
  icon: string;
  tabs: SectionTab[];
}

/** A tab with the settings form of one category, plus any related ones below it. */
const settings = (id: string, category: string, icon: string, ...more: string[]): SectionTab => ({
  id,
  icon,
  label: `config.categories.${category}.label`,
  kind: 'settings',
  categories: [category, ...more],
});

export const SECTIONS: Record<SectionId, Section> = {
  general: {
    icon: 'pi pi-globe',
    tabs: [
      settings('language', 'general', 'pi pi-language'),
      settings('modules', 'modules', 'pi pi-th-large'),
    ],
  },
  economy: {
    icon: 'pi pi-wallet',
    tabs: [
      {
        id: 'members',
        icon: 'pi pi-users',
        label: 'web.nav.members',
        kind: 'manage',
        page: () => import('../views/MembersView.vue'),
      },
      {
        id: 'shop',
        icon: 'pi pi-shopping-bag',
        label: 'web.nav.shop',
        kind: 'manage',
        page: () => import('../views/ShopView.vue'),
      },
      {
        id: 'loans',
        icon: 'pi pi-file-edit',
        label: 'web.nav.loans',
        kind: 'manage',
        page: () => import('../views/LoansView.vue'),
      },
      settings('rules', 'economy', 'pi pi-sliders-h'),
      settings('work', 'work', 'pi pi-briefcase'),
      settings('chat', 'chatMoney', 'pi pi-comments'),
      settings('income', 'collect', 'pi pi-id-card'),
      settings('wheel', 'wheel', 'pi pi-sync'),
      settings('games', 'games', 'pi pi-star'),
      settings('robbery', 'robbery', 'pi pi-eye-slash'),
      settings('crime', 'crime', 'pi pi-bolt', 'crimeFine'),
      settings('loan-terms', 'loans', 'pi pi-percentage'),
      settings('lottery', 'raffle', 'pi pi-ticket'),
    ],
  },
  levels: {
    icon: 'pi pi-bolt',
    tabs: [
      {
        id: 'ranking',
        icon: 'pi pi-sort-amount-down',
        label: 'config.categories.levelMembers.label',
        kind: 'manage',
        page: () => import('../views/LevelMembersView.vue'),
      },
      {
        id: 'rewards',
        icon: 'pi pi-gift',
        label: 'config.categories.levelRewards.label',
        kind: 'manage',
        page: () => import('../views/LevelRewardsView.vue'),
      },
      settings('experience', 'levels', 'pi pi-bolt'),
      settings('curve', 'levelCurve', 'pi pi-chart-line', 'levelFormula'),
      settings('voice', 'levelVoice', 'pi pi-microphone'),
      settings('messages', 'levelAnnounce', 'pi pi-megaphone', 'levelAnnounceRules'),
      settings('filters', 'levelFilters', 'pi pi-filter'),
      settings('rank-card', 'levelRank', 'pi pi-id-card'),
    ],
  },
};

export const SECTION_IDS = Object.keys(SECTIONS) as SectionId[];

/** Route name of a tab, e.g. "economy-shop". */
export const tabRoute = (section: SectionId, tab: string): string => `${section}-${tab}`;
