import { StyleProp, View, ViewStyle } from "react-native";
import Svg, { Circle, Line, Rect } from "react-native-svg";

import { usePalette } from "@/src/shared/hooks/usePalette";

type PitchLinesProps = {
  opacity?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * PitchLines — campo de futebol decorativo visto de cima.
 * Linhas brancas em cima de fundo transparente (usar dentro de container colorido).
 * Portado de prototype/js/screens.jsx (PitchLines).
 */
export function PitchLines({ opacity = 0.18, style }: PitchLinesProps) {
  const palette = usePalette();
  const lineColor = palette.fieldLine;
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
        viewBox="0 0 300 200"
        preserveAspectRatio="xMidYMid slice"
      >
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
      </Svg>
    </View>
  );
}
