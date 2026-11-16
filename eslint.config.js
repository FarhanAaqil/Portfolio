import js from '@eslint/js';
import globals from 'globals';

export default [
  // Vendored three.js and the retired prototypes are not part of the live site.
  {ignores: ['vendor/**', 'node_modules/**', 'Portfolio/**', 'anime-voyage.js', 'voyage3d.js', 'scroll.js', 'world.js', 'navigation.js', 'harbour-navigation.js']},
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
