// @ts-check
import globals from 'globals';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'build/**'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: {jsx: true},
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react': reactPlugin,
      'react-hooks': reactHooks,
      'prettier': prettierPlugin,
    },
    settings: {
      react: {version: 'detect'},
    },
    rules: {
      // Prettier integration
      'prettier/prettier': 'error',

      // TypeScript
      '@typescript-eslint/no-unused-vars': ['error', {argsIgnorePattern: '^_'}],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'error',

      // React
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Google style guide essentials
      'camelcase': ['error', {properties: 'never'}],
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
  prettierConfig,
];
