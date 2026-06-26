import { StyleSheet, View } from "react-native";
import Svg, { Circle, Line, Rect } from "react-native-svg";

/**
 * Linhas de campo sobre o gradiente vermelho do AvulsaCard.
 * Inline (não usa PitchLines compartilhado) porque o `fieldLine` tokenizado
 * é tuned pra gramado verde escuro e some sobre o vermelho. ViewBox achatado
 * acompanha o aspect ratio do card sem cropar tudo via `slice`.
 */
export function AvulsaPitch() {
  const stroke = "rgba(255,255,255,0.18)";
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 300 100"
        preserveAspectRatio="xMidYMid slice"
      >
        <Rect
          x={6}
          y={6}
          width={288}
          height={88}
          rx={4}
          fill="none"
          stroke={stroke}
          strokeWidth={2}
        />
        <Line
          x1={150}
          y1={6}
          x2={150}
          y2={94}
          stroke={stroke}
          strokeWidth={2}
        />
        <Circle
          cx={150}
          cy={50}
          r={22}
          fill="none"
          stroke={stroke}
          strokeWidth={2}
        />
        <Circle cx={150} cy={50} r={2.5} fill={stroke} />
        <Rect
          x={6}
          y={26}
          width={38}
          height={48}
          fill="none"
          stroke={stroke}
          strokeWidth={2}
        />
        <Rect
          x={256}
          y={26}
          width={38}
          height={48}
          fill="none"
          stroke={stroke}
          strokeWidth={2}
        />
      </Svg>
    </View>
  );
}
