import { Share } from "react-native";

import { GestorJogo } from "@/src/domain/GestorJogo";
import { Match } from "@/src/domain/Match";
import { Rules } from "@/src/domain/Rules";
import { ScreenTime } from "@/src/domain/ScreenTime";
import {
  fireEvent,
  renderWithProviders,
  screen,
  waitFor,
} from "@/src/test/renderWithProviders";

import HistoricoScreen from "../(pelada)/historico";

const expoRouter = require("expo-router") as any;
const router = expoRouter.__router as {
  push: jest.Mock;
  back: jest.Mock;
};

beforeEach(() => {
  router.push.mockClear();
  router.back.mockClear();
});

function gestorComUmaPartida(): GestorJogo {
  const g = new GestorJogo(
    "Fute CEF",
    new Rules({ playersPerTeam: 1, goalLimit: 5 }),
  );
  g.addPlayers(["Ana", "Bia"]);
  g.createTeams();
  const teamA = g.next[0];
  const teamB = g.next[1];
  const match = new Match(teamA, teamB);
  match.addGoal(teamA, teamA.players[0], new ScreenTime(1, 10));
  match.setResult();
  g.matches.push(match);
  return g;
}

describe("HistoricoScreen — compartilhar (F-06)", () => {
  it("não mostra o botão de compartilhar quando a lista está vazia", () => {
    const g = new GestorJogo("Fute CEF", new Rules());
    renderWithProviders(<HistoricoScreen />, { soccer: { gestor: g } });

    expect(
      screen.queryByRole("button", {
        name: "Compartilhar resumo da execução",
      }),
    ).toBeNull();
  });

  it("toque em compartilhar chama Share.share com o relatório gerado", async () => {
    const g = gestorComUmaPartida();
    const shareSpy = jest
      .spyOn(Share, "share")
      .mockResolvedValue({ action: "sharedAction" } as any);

    renderWithProviders(<HistoricoScreen />, { soccer: { gestor: g } });

    fireEvent.press(
      screen.getByRole("button", {
        name: "Compartilhar resumo da execução",
      }),
    );

    await waitFor(() => expect(shareSpy).toHaveBeenCalledTimes(1));
    const [arg] = shareSpy.mock.calls[0];
    expect(arg.message).toContain("🏆 Fute CEF");
    expect(arg.message).toContain("— FuteLista");

    shareSpy.mockRestore();
  });

  it("não trava em loading se Share.share rejeitar (usuário cancelou)", async () => {
    const g = gestorComUmaPartida();
    const shareSpy = jest
      .spyOn(Share, "share")
      .mockRejectedValue(new Error("user cancelled"));

    renderWithProviders(<HistoricoScreen />, { soccer: { gestor: g } });

    fireEvent.press(
      screen.getByRole("button", {
        name: "Compartilhar resumo da execução",
      }),
    );

    // Botão volta a ficar habilitado após a rejeição.
    await waitFor(() => {
      const botao = screen.getByRole("button", {
        name: "Compartilhar resumo da execução",
      });
      expect(botao.props.accessibilityState?.disabled).not.toBe(true);
    });

    shareSpy.mockRestore();
  });
});
