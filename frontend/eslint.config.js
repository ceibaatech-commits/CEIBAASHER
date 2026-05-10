// Flat ESLint config (v9) — adds the rules CRA used to enable transitively.
// Goal: surface react-hooks/exhaustive-deps, jsx-no-target-blank, no-undef,
// jsx-no-undef so we can fix them before they cause production bugs.
//
// Note: noConsole is already configured via package.json eslintConfig.
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const reactPlugin = require('eslint-plugin-react');
const babelParser = require('@babel/eslint-parser');
const globals = require('globals');

module.exports = [
  {
    ignores: ['build/**', 'node_modules/**', 'public/**'],
  },
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        requireConfigFile: false,
        babelOptions: {
          presets: ['@babel/preset-react'],
        },
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        process: 'readonly',
      },
    },
    plugins: {
      'react-hooks': reactHooksPlugin,
      react: reactPlugin,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      // Hooks correctness — the big one. Stale closures cause subtle UI bugs.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Security
      'react/jsx-no-target-blank': ['warn', { allowReferrer: false, enforceDynamicLinks: 'always' }],
      'react/no-danger-with-children': 'error',
      // Undefined variables
      'no-undef': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      // Allow console.warn / console.error (debugging) but warn on console.log
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
];
