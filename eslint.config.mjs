import eslint from "@eslint/js"
import tseslint from "typescript-eslint"
import reactPlugin from "eslint-plugin-react"
import reactHooksPlugin from "eslint-plugin-react-hooks"
import globals from "globals"

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // React
  {
    files: ["registry/**/*.{ts,tsx}"],
    ...reactPlugin.configs.flat.recommended,
    ...reactPlugin.configs.flat["jsx-runtime"],
    languageOptions: {
      ...reactPlugin.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.browser,
      },
    },
    settings: {
      react: { version: "detect" },
    },
  },

  // React Hooks
  {
    files: ["registry/**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  // Project rules
  {
    files: ["registry/**/*.{ts,tsx}"],
    rules: {
      "no-console": ["warn", { allow: ["error", "warn"] }],
      "no-undef": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },

  // Ignores
  {
    ignores: ["node_modules/", "public/", "src/"],
  },
]
