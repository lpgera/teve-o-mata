import js from '@eslint/js'
import globals from 'globals'

export default [
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node
    },
  },
  js.configs.recommended,
  {
    rules: {
      indent: ['error', 2,],
      'linebreak-style': ['error', 'unix',],
      quotes: ['error', 'single'],
      semi: ['error', 'never'],
    },
  },
]
