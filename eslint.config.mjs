import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
    ...compat.extends("next/core-web-vitals", "next/typescript"),
    {
        ignores: [
            "node_modules/**",
            ".next/**",
            "out/**",
            "build/**",
            "next-env.d.ts",
        ],
    },
    {
        // CommonJS config files legitimately use require()
        files: ["*.js", "*.cjs", "next.config.js", "tailwind.config.js"],
        rules: {
            "@typescript-eslint/no-require-imports": "off",
        },
    },
    {
        rules: {
            // The codebase uses <img> inside the invoice templates on purpose:
            // they are serialised with renderToStaticMarkup and rendered by
            // Puppeteer, where next/image would not resolve.
            "@next/next/no-img-element": "off",
            "@typescript-eslint/no-unused-vars": [
                "warn",
                { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
            ],
            "@typescript-eslint/no-explicit-any": "warn",
        },
    },
];

export default eslintConfig;
