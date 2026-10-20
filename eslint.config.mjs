import { defineConfig, globalIgnores } from 'eslint/config'
import eslintPluginVue from 'eslint-plugin-vue'
import typescriptEslint from 'typescript-eslint'

const controlFlowRules = {
  curly: ['error', 'all'],
}

export default defineConfig([
  globalIgnores([
    '**/node_modules/**',
    '**/dist/**',
    '**/coverage/**',
    '.codegraph/**',
    '.pnpm-store/**',
    'apps/backend/drizzle/meta/**',
    'docs/archive/**',
  ]),
  {
    name: 'javascript control flow',
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
    },
    rules: controlFlowRules,
  },
  {
    name: 'typescript control flow',
    files: ['**/*.{ts,mts,cts,tsx}'],
    languageOptions: {
      parser: typescriptEslint.parser,
    },
    rules: controlFlowRules,
  },
  eslintPluginVue.configs['flat/base'],
  {
    name: 'vue script control flow',
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: typescriptEslint.parser,
      },
    },
    rules: controlFlowRules,
  },
])
