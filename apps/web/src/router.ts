import { createRouter, createWebHistory } from 'vue-router';
import { loadMe } from './lib/session.ts';

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
        {
          path: 'settings/:category',
          name: 'settings',
          component: () => import('./views/SettingsView.vue'),
          props: true,
        },
        { path: 'members', name: 'members', component: () => import('./views/MembersView.vue') },
        { path: 'shop', name: 'shop', component: () => import('./views/ShopView.vue') },
        { path: 'loans', name: 'loans', component: () => import('./views/LoansView.vue') },
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
