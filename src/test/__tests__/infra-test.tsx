import { Text } from "react-native";

import { renderWithProviders, screen } from "../renderWithProviders";

describe("infraestrutura de teste", () => {
  it("renderiza um componente trivial com providers", () => {
    renderWithProviders(<Text>oi</Text>);
    expect(screen.getByText("oi")).toBeTruthy();
  });
});
