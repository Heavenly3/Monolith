import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  { ignores: ['node_modules/', 'storage/', '**/dist/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Vue rules only for the dashboard.
  ...pluginVue.configs['flat/recommended'].map((config) => ({
    ...config,
    files: ['apps/web/**/*.vue'],
  })),
  {
    files: ['**/*.ts', '**/*.mjs', '**/*.vue'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
    },
  },
  {
    files: ['apps/web/src/**/*.{ts,vue}'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { parser: tseslint.parser, extraFileExtensions: ['.vue'] },
    },
  },
  prettierRecommended,
);
