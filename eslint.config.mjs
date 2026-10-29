import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  // Cargar datos en useEffect es el patrón que usamos en las pantallas.
  { rules: { "react-hooks/set-state-in-effect": "off" } },
  { ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"] },
];

export default eslintConfig;
