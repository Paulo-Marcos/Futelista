import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { Text } from "react-native";

import { SoccerProvider } from "@/src/app-shell/soccerProvider";
import { RepositorioPeladaEmMemoria } from "@/src/infrastructure/storage/RepositorioPeladaEmMemoria";

const getItem = AsyncStorage.getItem as jest.Mock;

function renderProvider() {
  return render(
    <SoccerProvider repositorio={new RepositorioPeladaEmMemoria()}>
      <Text>App aberto</Text>
    </SoccerProvider>,
  );
}

describe("SoccerProvider — boot (D-052)", () => {
  afterEach(() => {
    getItem.mockReset();
    getItem.mockImplementation(async () => null);
  });

  it("sem pelada ativa, conclui o boot e renderiza o app", async () => {
    getItem.mockResolvedValue(null);
    renderProvider();
    expect(await screen.findByText("App aberto")).toBeTruthy();
  });

  it("storage ilegível mostra a falha em vez de tela em branco", async () => {
    getItem.mockRejectedValue(new Error("Disco indisponível"));
    renderProvider();

    expect(
      await screen.findByText("Não foi possível abrir suas peladas"),
    ).toBeTruthy();
    expect(screen.getByText("Disco indisponível")).toBeTruthy();
    expect(screen.queryByText("App aberto")).toBeNull();
  });

  it("'Tentar de novo' refaz o boot e abre o app quando o storage volta", async () => {
    getItem.mockRejectedValueOnce(new Error("Disco indisponível"));
    getItem.mockResolvedValue(null);
    renderProvider();

    fireEvent.press(
      await screen.findByRole("button", { name: "Tentar de novo" }),
    );

    await waitFor(() => expect(screen.getByText("App aberto")).toBeTruthy());
  });
});
