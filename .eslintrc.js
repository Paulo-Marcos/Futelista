// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: ["expo", "prettier"],
  plugins: ["prettier"],
  rules: {
    // "prettier/prettier": "error",
    "prettier/prettier": ["error", { endOfLine: "auto" }],
  },
  overrides: [
    {
      // Pureza do domínio verificada por máquina (ver .claude/rules/domain.md).
      // src/domain/ é TS puro: sem React, sem React Native, sem Expo, sem infra.
      // Única exceção: o polyfill 'react-native-get-random-values' (necessário
      // para uuid.v4() rodar no JS engine do RN) — preservado por barrar apenas
      // o nome exato 'react-native' (e 'react-native/*'), nunca 'react-native*'.
      files: ["src/domain/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: [
                  "react",
                  "react-dom",
                  "react-native",
                  "react-native/*",
                  "expo",
                  "expo-*",
                  "@expo/*",
                  "@react-native-async-storage/*",
                  "@/providers",
                  "@/providers/*",
                  "@/contexts",
                  "@/contexts/*",
                  "@/hooks",
                  "@/hooks/*",
                  "@/app-shell",
                  "@/app-shell/*",
                ],
                message:
                  "src/domain/ deve permanecer puro: proibido importar React, React Native, Expo ou a camada de infraestrutura (providers/contexts/hooks/app-shell). Exceção permitida: o polyfill 'react-native-get-random-values' antes do 'uuid'.",
              },
            ],
          },
        ],
      },
    },
  ],
};
