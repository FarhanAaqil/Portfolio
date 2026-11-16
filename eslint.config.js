import js from '@eslint/js';
import globals from 'globals';

export default [
  // Vendored three.js is checked in as-is.
  {ignores: ['vendor/**', 'node_modules/**', 'Portfolio/**']},
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {ecmaVersion: 2023, sourceType: 'module', globals: globals.browser},
    rules: {
      'no-unused-vars': ['error', {argsIgnorePattern: '^_', caughtErrors: 'none'}],
      eqeqeq: 'error',
      'no-var': 'error',
      'prefer-const': 'error'
    }
  },
  {
    files: ['world-navigation.js', 'mobile.js'],
    languageOptions: {sourceType: 'script'}
  },
  {
    files: ['**/*.mjs', 'eslint.config.js'],
    languageOptions: {ecmaVersion: 2023, sourceType: 'module', globals: globals.node}
  }
];
