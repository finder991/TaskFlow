import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const layerRules = {
  shared: ['@/app/*', '@/pages/*', '@/widgets/*', '@/features/*', '@/entities/*'],
  entities: ['@/app/*', '@/pages/*', '@/widgets/*', '@/features/*'],
  features: ['@/app/*', '@/pages/*', '@/widgets/*'],
  widgets: ['@/app/*', '@/pages/*'],
  pages: ['@/app/*'],
};

const layerOverrides = Object.entries(layerRules).map(([layer, forbidden]) => ({
  files: [`src/${layer}/**/*.{ts,tsx}`],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          ...forbidden.map((pattern) => ({
            group: [pattern],
            message: `Шар "${layer}" не може імпортувати з вищого шару (FSD).`,
          })),
          {
            group: ['@/*/*/ui/*', '@/*/*/model/*', '@/*/*/api/*', '@/*/*/lib/*'],
            message: 'Імпортуйте лише через публічний API слайса (index.ts).',
          },
        ],
      },
    ],
  },
}));

export default tseslint.config(
  { ignores: ['dist', 'storybook-static', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  ...layerOverrides,
  {
    files: ['src/entities/*/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^@/entities/(?!.*/@x/).*',
              message:
                'Не імпортуйте сусідній entity напряму — використайте cross-import API `@/entities/<slice>/@x/<current>`.',
            },
            {
              group: ['@/app/*', '@/pages/*', '@/widgets/*', '@/features/*'],
              message: 'Шар "entities" не може імпортувати з вищого шару (FSD).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/entities/*/@x/*.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/*.stories.tsx'],
    rules: { 'no-restricted-imports': 'off' },
  },
);
