import { alphaHex, hexToRgb, mixHex, rgbToHex } from "./mix";

describe("mix helpers", () => {
  it("deverá converter hex em rgb sem perda nos bytes", () => {
    expect(hexToRgb("#EE2737")).toEqual([0xee, 0x27, 0x37]);
    expect(hexToRgb("FFFFFF")).toEqual([255, 255, 255]);
  });

  it("deverá converter rgb em hex no padrão maiúsculo de 6 dígitos", () => {
    expect(rgbToHex(238, 39, 55)).toBe("#EE2737");
    expect(rgbToHex(0, 0, 0)).toBe("#000000");
  });

  it("deverá grampear rgb dentro de [0,255] ao virar hex", () => {
    expect(rgbToHex(-10, 300, 128)).toBe("#00FF80");
  });

  it("deverá misturar duas cores no espaço sRGB", () => {
    expect(mixHex("#FFFFFF", "#000000", 50)).toBe("#808080");
    expect(mixHex("#FF0000", "#FFFFFF", 0)).toBe("#FFFFFF");
    expect(mixHex("#FF0000", "#FFFFFF", 100)).toBe("#FF0000");
  });

  it("deverá montar rgba(...) preservando os bytes da primária", () => {
    expect(alphaHex("#EE2737", 0.55)).toBe("rgba(238, 39, 55, 0.55)");
  });
});
