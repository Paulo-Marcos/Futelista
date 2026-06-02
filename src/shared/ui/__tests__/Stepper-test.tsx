import { Stepper } from "../Stepper";
import {
  fireEvent,
  renderWithProviders,
  screen,
} from "@/src/test/renderWithProviders";

/**
 * O Stepper expõe dois Pressable sem accessibilityLabel.
 * Testamos via UNSAFE_getAllByType(Pressable) — a ordem é [-, +].
 */
import { Pressable } from "react-native";

function getButtons() {
  const all = screen.UNSAFE_getAllByType(Pressable);
  return { decrementar: all[0], incrementar: all[1] };
}

describe("Stepper", () => {
  it("renderiza o valor atual", () => {
    renderWithProviders(<Stepper value={4} onChange={() => {}} />);
    expect(screen.getByText("4")).toBeTruthy();
  });

  it("chama onChange ao incrementar", () => {
    const onChange = jest.fn();
    renderWithProviders(
      <Stepper value={4} onChange={onChange} min={1} max={10} />,
    );

    fireEvent.press(getButtons().incrementar);

    expect(onChange).toHaveBeenCalledWith(5);
  });

  it("chama onChange ao decrementar", () => {
    const onChange = jest.fn();
    renderWithProviders(
      <Stepper value={4} onChange={onChange} min={1} max={10} />,
    );

    fireEvent.press(getButtons().decrementar);

    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("respeita o passo (step)", () => {
    const onChange = jest.fn();
    renderWithProviders(
      <Stepper value={10} onChange={onChange} min={0} max={59} step={5} />,
    );

    fireEvent.press(getButtons().incrementar);
    expect(onChange).toHaveBeenCalledWith(15);

    onChange.mockClear();
    fireEvent.press(getButtons().decrementar);
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it("não decrementa abaixo do min", () => {
    const onChange = jest.fn();
    renderWithProviders(
      <Stepper value={1} onChange={onChange} min={1} max={10} />,
    );

    fireEvent.press(getButtons().decrementar);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("não incrementa acima do max", () => {
    const onChange = jest.fn();
    renderWithProviders(
      <Stepper value={10} onChange={onChange} min={1} max={10} />,
    );

    fireEvent.press(getButtons().incrementar);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("desabilitado: ambos os botões aparecem como disabled", () => {
    renderWithProviders(<Stepper value={5} onChange={jest.fn()} disabled />);

    const { decrementar, incrementar } = getButtons();
    expect(decrementar.props.disabled).toBe(true);
    expect(incrementar.props.disabled).toBe(true);
  });
});
