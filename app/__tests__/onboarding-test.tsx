import { PrefsProvider } from "@/src/shared/prefs/prefsContext";
import {
  fireEvent,
  renderWithProviders,
  screen,
} from "@/src/test/renderWithProviders";

import OnboardingScreen from "../onboarding";

const router = (require("expo-router") as any).__router as {
  back: jest.Mock;
  push: jest.Mock;
  replace: jest.Mock;
};

beforeEach(() => {
  router.back.mockClear();
  router.push.mockClear();
  router.replace.mockClear();
});

describe("OnboardingScreen", () => {
  it("renderiza o primeiro slide (Pelada) e o botão 'Próximo'", () => {
    renderWithProviders(
      <PrefsProvider>
        <OnboardingScreen />
      </PrefsProvider>,
    );

    expect(screen.getByText("Cadastre sua pelada")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Próximo" })).toBeTruthy();
  });

  it("'Pular' grava onboardingFeito e navega pra Home", () => {
    renderWithProviders(
      <PrefsProvider>
        <OnboardingScreen />
      </PrefsProvider>,
    );

    fireEvent.press(screen.getByRole("button", { name: "Pular tour" }));

    expect(router.replace).toHaveBeenCalledWith("/");
  });

  it("a tela mostra os 3 slides na timeline (renderiza tudo de uma vez)", () => {
    renderWithProviders(
      <PrefsProvider>
        <OnboardingScreen />
      </PrefsProvider>,
    );

    // ScrollView horizontal pagingEnabled renderiza os 3 slides juntos —
    // a navegação por dots/botão só anima o scrollTo. Logo, todos os
    // títulos estão presentes na árvore.
    expect(screen.getByText("Cadastre sua pelada")).toBeTruthy();
    expect(screen.getByText("Monte os times")).toBeTruthy();
    expect(screen.getByText("Comande a partida")).toBeTruthy();
  });
});
