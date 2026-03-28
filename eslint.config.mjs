import eslint from "@eslint/js"
import tseslint from "typescript-eslint"
import reactHooksPlugin from "eslint-plugin-react-hooks"
import globals from "globals"

const registryFiles = ["registry/**/*.{ts,tsx}"]

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: registryFiles,
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
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

  { ignores: ["node_modules/", "public/", "src/"] },
]
