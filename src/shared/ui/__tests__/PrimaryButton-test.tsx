import { PrimaryButton } from "../PrimaryButton";
import {
  fireEvent,
  renderWithProviders,
  screen,
} from "@/src/test/renderWithProviders";

describe("PrimaryButton", () => {
  it("renderiza o label", () => {
    renderWithProviders(<PrimaryButton label="Cadastrar" onPress={() => {}} />);
    expect(screen.getByText("Cadastrar")).toBeTruthy();
  });

  it("dispara onPress quando o usuário toca", () => {
    const onPress = jest.fn();
    renderWithProviders(<PrimaryButton label="Iniciar" onPress={onPress} />);

    fireEvent.press(screen.getByRole("button", { name: "Iniciar" }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("não dispara onPress quando disabled", () => {
    const onPress = jest.fn();
    renderWithProviders(
      <PrimaryButton label="Iniciar" onPress={onPress} disabled />,
    );

    fireEvent.press(screen.getByRole("button", { name: "Iniciar" }));

    expect(onPress).not.toHaveBeenCalled();
  });

  it("reflete disabled em accessibilityState", () => {
    renderWithProviders(
      <PrimaryButton label="Iniciar" onPress={() => {}} disabled />,
    );

    const btn = screen.getByRole("button", { name: "Iniciar" });
    expect(btn.props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("usa accessibilityLabel custom quando fornecido", () => {
    renderWithProviders(
      <PrimaryButton
        label="OK"
        accessibilityLabel="Confirmar cadastro"
        onPress={() => {}}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Confirmar cadastro" }),
    ).toBeTruthy();
  });
});
