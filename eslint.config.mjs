import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    // Version fixée : la détection automatique d'eslint-plugin-react échoue avec ESLint 10
    settings: { react: { version: "19.3" } },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react/no-unescaped-entities": "off",
      // Règles « React Compiler » d'eslint-plugin-react-hooks 7 : elles signalent des motifs
      // présents dans tout le code historique (setState dans un effet, fonctions hissées),
      // qui fonctionnent mais sont à reprendre progressivement.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/static-components": "warn",
    },
  },
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", ".impeccable/**"],
  },
];

export default eslintConfig;
