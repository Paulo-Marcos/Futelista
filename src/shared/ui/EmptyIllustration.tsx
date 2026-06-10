import Svg, {
  Circle,
  Ellipse,
  G,
  Line,
  Rect,
} from "react-native-svg";

import { usePalette } from "@/src/shared/hooks/usePalette";

/**
 * Ilustrações SVG simples para `EmptyState` (M-16). São compostas com
 * cores da paleta atual — escuro/claro herdam automaticamente.
 *
 * Tipos:
 *  - `campo`  — campo + bola + sombra. Genérico de "ainda não tem nada
 *               de futebol pra ver" (gestão, próxima partida, histórico).
 *  - `lista`  — clipboard vazio. Para lista de jogadores/peladas sem
 *               item.
 *  - `tempo`  — relógio/silhueta de timer. Para "ainda não rodou
 *               nenhuma partida" / histórico vazio.
 */
export type IlustracaoEmpty = "campo" | "lista" | "tempo";

export function EmptyIllustration({
  variante,
  size = 120,
}: {
  variante: IlustracaoEmpty;
  size?: number;
}) {
  const palette = usePalette();
  const outline = palette.outlineVariant;
  const ink = palette.onSurfaceVariant;
  const surface = palette.surfaceContainerLow;
  const accent = palette.primary;

  if (variante === "lista") {
    return (
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Ellipse cx="60" cy="108" rx="38" ry="4" fill={ink} opacity={0.12} />
        <Rect
          x="32"
          y="20"
          width="56"
          height="76"
          rx="6"
          fill={surface}
          stroke={outline}
          strokeWidth={1.5}
        />
        <Rect
          x="48"
          y="14"
          width="24"
          height="10"
          rx="2"
          fill={surface}
          stroke={outline}
          strokeWidth={1.5}
        />
        <Line x1="42" y1="42" x2="78" y2="42" stroke={outline} strokeWidth={1.5} />
        <Line x1="42" y1="56" x2="72" y2="56" stroke={outline} strokeWidth={1.5} />
        <Line x1="42" y1="70" x2="66" y2="70" stroke={outline} strokeWidth={1.5} />
      </Svg>
    );
  }

  if (variante === "tempo") {
    return (
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Ellipse cx="60" cy="108" rx="34" ry="4" fill={ink} opacity={0.12} />
        <Circle
          cx="60"
          cy="60"
          r="36"
          fill={surface}
          stroke={outline}
          strokeWidth={2}
        />
        <Line x1="60" y1="32" x2="60" y2="38" stroke={ink} strokeWidth={2} />
        <Line x1="88" y1="60" x2="82" y2="60" stroke={ink} strokeWidth={2} />
        <Line x1="60" y1="88" x2="60" y2="82" stroke={ink} strokeWidth={2} />
        <Line x1="32" y1="60" x2="38" y2="60" stroke={ink} strokeWidth={2} />
        <Line
          x1="60"
          y1="60"
          x2="60"
          y2="42"
          stroke={accent}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <Line
          x1="60"
          y1="60"
          x2="74"
          y2="60"
          stroke={accent}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <Circle cx="60" cy="60" r="3" fill={accent} />
      </Svg>
    );
  }

  // variante === "campo"
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Ellipse cx="60" cy="108" rx="38" ry="4" fill={ink} opacity={0.14} />
      <Rect
        x="14"
        y="34"
        width="92"
        height="60"
        rx="4"
        fill={surface}
        stroke={outline}
        strokeWidth={1.5}
      />
      <Line x1="60" y1="34" x2="60" y2="94" stroke={outline} strokeWidth={1.5} />
      <Circle
        cx="60"
        cy="64"
        r="10"
        fill="none"
        stroke={outline}
        strokeWidth={1.5}
      />
      <Rect
        x="14"
        y="52"
        width="14"
        height="24"
        fill="none"
        stroke={outline}
        strokeWidth={1.5}
      />
      <Rect
        x="92"
        y="52"
        width="14"
        height="24"
        fill="none"
        stroke={outline}
        strokeWidth={1.5}
      />
      {/* Bola */}
      <G>
        <Ellipse
          cx="84"
          cy="92"
          rx="6"
          ry="1.6"
          fill={ink}
          opacity={0.25}
        />
        <Circle cx="84" cy="86" r="6" fill={surface} stroke={ink} strokeWidth={1.5} />
        <Line x1="80" y1="84" x2="88" y2="88" stroke={ink} strokeWidth={1} />
        <Line x1="80" y1="88" x2="88" y2="84" stroke={ink} strokeWidth={1} />
      </G>
    </Svg>
  );
}
