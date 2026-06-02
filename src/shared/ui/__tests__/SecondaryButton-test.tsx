import { SecondaryButton } from "../SecondaryButton";
import {
  fireEvent,
  renderWithProviders,
  screen,
} from "@/src/test/renderWithProviders";

describe("SecondaryButton", () => {
  it("renderiza o label", () => {
    renderWithProviders(
      <SecondaryButton label="Cancelar" onPress={() => {}} />,
    );
    expect(screen.getByText("Cancelar")).toBeTruthy();
  });

  it("dispara onPress quando ativo", () => {
    const onPress = jest.fn();
    renderWithProviders(
      <SecondaryButton label="Voltar" onPress={onPress} />,
    );

    fireEvent.press(screen.getByRole("button", { name: "Voltar" }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("não dispara onPress quando disabled", () => {
    const onPress = jest.fn();
    renderWithProviders(
      <SecondaryButton label="Voltar" onPress={onPress} disabled />,
    );

    fireEvent.press(screen.getByRole("button", { name: "Voltar" }));

    expect(onPress).not.toHaveBeenCalled();
  });

  it("renderiza variante destrutiva (ainda dispara onPress)", () => {
    const onPress = jest.fn();
    renderWithProviders(
      <SecondaryButton label="Excluir" onPress={onPress} destructive />,
    );

    fireEvent.press(screen.getByRole("button", { name: "Excluir" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
