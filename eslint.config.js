import js from '@eslint/js'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules', '.vercel', '*.config.js', 'fix_scales.js'] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  { files: ['**/*.js'], extends: [tseslint.configs.disableTypeChecked] },
  {
    files: ['src/**/*.{ts,tsx}', 'vite.config.ts'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-misused-spread': 'off',
    },
  },
  {
    files: ['src/**/*.tsx'],
    ...jsxA11y.flatConfigs.recommended,
    plugins: { ...jsxA11y.flatConfigs.recommended.plugins, 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: { ...jsxA11y.flatConfigs.recommended.rules, 'jsx-a11y/media-has-caption': 'off', ...reactHooks.configs['recommended-latest'].rules, ...reactRefresh.configs.vite.rules },
  },
)
