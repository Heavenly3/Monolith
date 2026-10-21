import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { SECTIONS, SECTION_IDS, tabRoute } from './lib/sections.ts';
import { loadMe } from './lib/session.ts';

const SettingsView = () => import('./views/SettingsView.vue');

/** /g/<guild>/<section>/<tab>; the section alone opens its first tab. */
function sectionRoutes(): RouteRecordRaw[] {
  return SECTION_IDS.map((section) => ({
    path: section,
    component: () => import('./views/SectionLayout.vue'),
    props: { section },
    children: [
      { path: '', redirect: { name: tabRoute(section, SECTIONS[section].tabs[0]!.id) } },
      ...SECTIONS[section].tabs.map((tab) => ({
        path: tab.id,
        name: tabRoute(section, tab.id),
        component: tab.category ? SettingsView : tab.page!,
        props: tab.category ? { category: tab.category } : false,
      })),
    ],
  }));
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('./views/LoginView.vue') },
    { path: '/', name: 'guilds', component: () => import('./views/GuildsView.vue') },
    {
      path: '/g/:guildId',
      component: () => import('./views/GuildLayout.vue'),
      props: true,
      children: [
        { path: '', name: 'overview', component: () => import('./views/OverviewView.vue') },
        ...sectionRoutes(),
        { path: 'history', name: 'history', component: () => import('./views/HistoryView.vue') },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

// Everything except the login page needs a session.
router.beforeEach(async (to) => {
  const me = await loadMe();
  if (!me && to.name !== 'login') return { name: 'login', query: to.query };
  if (me && to.name === 'login') return { name: 'guilds' };
  return true;
});
