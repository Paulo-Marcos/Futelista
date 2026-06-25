import { ThemedText } from "../ThemedText";
import { renderWithProviders, screen } from "@/src/test/renderWithProviders";

// Renderizamos via `renderWithProviders` (@testing-library) em vez de
// `react-test-renderer` cru: sob o React 19, o render direto não é
// embrulhado em `act()`, o que faz o `useColorScheme()` do tema vazar um
// require após o teardown do Jest e o tree sair como `null`. O helper do
// projeto resolve isso e mantém o snapshot estável.
it(`renders correctly`, () => {
  renderWithProviders(<ThemedText>Snapshot test!</ThemedText>);

  expect(screen.toJSON()).toMatchSnapshot();
});
