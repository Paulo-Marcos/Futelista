// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// O SDK 54 liga "package exports" do Metro por padrão. O pacote `uuid` v10
// publica um `exports` cujas condições `browser`/`default` apontam para o
// build ESM (`dist/esm-browser`), que quebra em runtime no Hermes
// (`Cannot read properties of undefined (reading 'v1')`).
//
// Aqui desligamos o package-exports APENAS para o `uuid`, restaurando a
// resolução por `main` + `browser` map (build CJS com `rng-browser`, que usa
// o `crypto.getRandomValues` polyfillado por `react-native-get-random-values`)
// — exatamente como funcionava no SDK 51. Todos os demais pacotes continuam
// com package-exports ligado (default do Expo).
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "uuid" || moduleName.startsWith("uuid/")) {
    return context.resolveRequest(
      { ...context, unstable_enablePackageExports: false },
      moduleName,
      platform,
    );
  }
  return (defaultResolveRequest ?? context.resolveRequest)(
    context,
    moduleName,
    platform,
  );
};

module.exports = config;
