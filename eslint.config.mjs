import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [{
    files: ["**/*.ts"],
    ignores: ["**/dist/**", "**/node_modules/**"],
    plugins: {
        "@typescript-eslint": typescriptEslint,
    },
    languageOptions: {
        parser: tsParser,
        ecmaVersion: 2022,
        sourceType: "module",
    },
    rules: {
        "@typescript-eslint/naming-convention": ["warn", {
            "selector": "variable",
            "format": ["camelCase", "UPPER_CASE", "PascalCase"],
            "leadingUnderscore": "allow"
        }],
        "@typescript-eslint/no-unused-vars": ["warn", {
            "argsIgnorePattern": "^_",
            "varsIgnorePattern": "^_"
        }],
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-require-imports": "off"
    },
}];