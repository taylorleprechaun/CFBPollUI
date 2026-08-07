import js from '@eslint/js'
import globals from 'globals'
import perfectionist from 'eslint-plugin-perfectionist'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      perfectionist,
    },
    rules: {
      'perfectionist/sort-imports': ['error', { type: 'natural', order: 'asc' }],
      'perfectionist/sort-named-imports': ['error', { type: 'natural', order: 'asc' }],
      'perfectionist/sort-exports': ['error', { type: 'natural', order: 'asc' }],
      'perfectionist/sort-named-exports': ['error', { type: 'natural', order: 'asc' }],
      'perfectionist/sort-interfaces': ['error', { type: 'natural', order: 'asc' }],
      'perfectionist/sort-object-types': ['error', { type: 'natural', order: 'asc' }],
      'perfectionist/sort-classes': ['error', { type: 'natural', order: 'asc' }],
      'perfectionist/sort-modules': [
        'error',
        { type: 'natural', order: 'asc', groups: ['export-function', 'function', 'export-class', 'class'] },
      ],
    },
  },
])
