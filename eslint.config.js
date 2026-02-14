const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angularEslint = require('@angular-eslint/eslint-plugin');
const angularTemplate = require('@angular-eslint/eslint-plugin-template');
const angularTemplateParser = require('@angular-eslint/template-parser');
const eslintConfigPrettier = require('eslint-config-prettier');
const importPlugin = require('eslint-plugin-import');

module.exports = tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', '.angular/**']
  },
  {
    files: ['**/*.ts'],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
    plugins: {
      '@angular-eslint': angularEslint,
      import: importPlugin
    },
    processor: angularTemplate.processors['extract-inline-html'],
    rules: {
      '@angular-eslint/component-class-suffix': ['error', { suffixes: ['Component', 'Page'] }],
      '@angular-eslint/directive-class-suffix': 'error',
      '@angular-eslint/no-empty-lifecycle-method': 'error',
      '@angular-eslint/prefer-standalone': 'error',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'import/no-cycle': 'error',
      'import/no-default-export': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }]
    }
  },
  {
    files: ['**/*.spec.ts'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        jasmine: 'readonly'
      }
    }
  },
  {
    files: ['**/*.html'],
    languageOptions: {
      parser: angularTemplateParser
    },
    plugins: {
      '@angular-eslint/template': angularTemplate
    },
    rules: {}
  },
  eslintConfigPrettier
);
