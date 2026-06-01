// React Native default styling doesn't support server rendering.
// On web we fix the scheme to 'light' to avoid first-render mismatch between
// server (HTML) and client.
export function useColorScheme() {
  return "light";
}
