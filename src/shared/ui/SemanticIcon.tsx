import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { ComponentProps } from "react";

import { usePalette } from "@/src/shared/hooks/usePalette";

import { glyphFor, type IconName } from "./IconRegistry";

type MdiName = ComponentProps<typeof MaterialCommunityIcons>["name"];

type SemanticIconProps = {
  /** Papel semântico — não passe glifos MDI crus aqui. */
  name: IconName;
  size?: number;
  /** Default: `palette.onSurface` (texto principal do tema corrente). */
  color?: string;
};

/**
 * SemanticIcon — único caminho para renderizar ícones na UI.
 *
 * Mantém a app inteira no mesmo conjunto (MDI) e plugada aos tokens de
 * cor (`palette.onSurface` quando nenhuma cor é passada).
 */
export function SemanticIcon({ name, size = 18, color }: SemanticIconProps) {
  const palette = usePalette();
  return (
    <MaterialCommunityIcons
      name={glyphFor(name) as MdiName}
      size={size}
      color={color ?? palette.onSurface}
    />
  );
}
