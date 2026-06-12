import { StyleProp, View, ViewStyle } from "react-native";
import Svg, { Circle, Line, Rect } from "react-native-svg";

import { usePalette } from "@/src/shared/hooks/usePalette";

type PitchOrientation = "landscape" | "portrait";
type PitchFit = "slice" | "meet";

type PitchLinesProps = {
  opacity?: number;
  style?: StyleProp<ViewStyle>;
  /**
   * Orientação do campo desenhado.
   * - `landscape` (padrão): campo deitado 300×200 — usado nos cards/hero,
   *   que têm proporção larga.
   * - `portrait`: campo em pé 200×300 — para containers altos (ex.: Splash),
   *   onde o campo deitado sairia cortado pela metade.
   */
  orientation?: PitchOrientation;
  /**
   * Como o campo preenche o container.
   * - `slice` (padrão): cobre o container, cortando o excesso (textura).
   * - `meet`: encaixa o campo INTEIRO dentro do container (sem corte),
   *   centralizado. Use quando o objetivo é mostrar o campo completo.
   */
  fit?: PitchFit;
};

/**
 * PitchLines — campo de futebol decorativo visto de cima.
 * Linhas brancas em cima de fundo transparente (usar dentro de container colorido).
 * Portado de prototype/js/screens.jsx (PitchLines).
 */
export function PitchLines({
  opacity = 0.18,
  style,
  orientation = "landscape",
  fit = "slice",
}: PitchLinesProps) {
  const palette = usePalette();
  const lineColor = palette.fieldLine;
  const portrait = orientation === "portrait";
  const viewBox = portrait ? "0 0 200 300" : "0 0 300 200";
  const preserve =
    fit === "meet" ? "xMidYMid meet" : "xMidYMid slice";
  return (
    <View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox={viewBox}
        preserveAspectRatio={preserve}
      >
        {portrait ? (
          // ----- Campo em pé (200×300): gols em cima/embaixo -----
          <>
            <Rect
              x="6"
              y="6"
              width="188"
              height="288"
              rx="6"
              stroke={lineColor}
              strokeWidth={1.5}
              fill="none"
            />
            {/* Linha do meio (horizontal) */}
            <Line
              x1="6"
              y1="150"
              x2="194"
              y2="150"
              stroke={lineColor}
              strokeWidth={1.5}
            />
            <Circle
              cx="100"
              cy="150"
              r="34"
              stroke={lineColor}
              strokeWidth={1.5}
              fill="none"
            />
            <Circle cx="100" cy="150" r="2.5" fill={lineColor} />
            {/* Grande área — topo / base */}
            <Rect
              x="58"
              y="6"
              width="84"
              height="46"
              stroke={lineColor}
              strokeWidth={1.5}
              fill="none"
            />
            <Rect
              x="58"
              y="248"
              width="84"
              height="46"
              stroke={lineColor}
              strokeWidth={1.5}
              fill="none"
            />
            {/* Pequena área — topo / base */}
            <Rect
              x="80"
              y="6"
              width="40"
              height="18"
              stroke={lineColor}
              strokeWidth={1.5}
              fill="none"
            />
            <Rect
              x="80"
              y="276"
              width="40"
              height="18"
              stroke={lineColor}
              strokeWidth={1.5}
              fill="none"
            />
          </>
        ) : (
          // ----- Campo deitado (300×200): gols nas laterais -----
          <>
            <Rect
              x="6"
              y="6"
              width="288"
              height="188"
              rx="6"
              stroke={lineColor}
              strokeWidth={1.5}
              fill="none"
            />
            <Line
              x1="150"
              y1="6"
              x2="150"
              y2="194"
              stroke={lineColor}
              strokeWidth={1.5}
            />
            <Circle
              cx="150"
              cy="100"
              r="34"
              stroke={lineColor}
              strokeWidth={1.5}
              fill="none"
            />
            <Circle cx="150" cy="100" r="2.5" fill={lineColor} />
            <Rect
              x="6"
              y="58"
              width="46"
              height="84"
              stroke={lineColor}
              strokeWidth={1.5}
              fill="none"
            />
            <Rect
              x="248"
              y="58"
              width="46"
              height="84"
              stroke={lineColor}
              strokeWidth={1.5}
              fill="none"
            />
            <Rect
              x="6"
              y="80"
              width="18"
              height="40"
              stroke={lineColor}
              strokeWidth={1.5}
              fill="none"
            />
            <Rect
              x="276"
              y="80"
              width="18"
              height="40"
              stroke={lineColor}
              strokeWidth={1.5}
              fill="none"
            />
          </>
        )}
      </Svg>
    </View>
  );
}
