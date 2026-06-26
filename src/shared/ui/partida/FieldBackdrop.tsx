import { StyleSheet, View } from "react-native";
import Svg, {
  Circle as SvgCircle,
  Defs,
  Line as SvgLine,
  Pattern,
  Rect as SvgRect,
} from "react-native-svg";

import { usePalette } from "@/src/shared/hooks/usePalette";

// FieldBackdrop — réplica 1:1 do `<svg class="fieldbg">` do design Partida.html:
// listras em pattern + contorno + linha do meio + círculo central + grande/pequena
// área (cada lado) + arcos de canto. viewBox 200×360, preserveAspectRatio="none"
// para esticar e ocupar o campo todo (igual ao protótipo).
export function FieldBackdrop() {
  const palette = usePalette();
  // Linhas mais nítidas que o palette.fieldLine (alpha 0.10 no dark — muito
  // tímido sobre gramado escuro). Hardcode local para não impactar outros
  // componentes que dependem do token (PitchLines no Hero, AvulsaPitch).
  const LINE = "rgba(255,255,255,0.32)";
  const SW = 2.4;
  return (
    <View style={styles.fieldBg} pointerEvents="none">
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 200 360"
        preserveAspectRatio="none"
      >
        <Defs>
          <Pattern
            id="stripes"
            width={200}
            height={40}
            patternUnits="userSpaceOnUse"
          >
            <SvgRect width={200} height={40} fill={palette.fieldA} />
            <SvgRect y={20} width={200} height={20} fill={palette.fieldB} />
          </Pattern>
        </Defs>
        <SvgRect width={200} height={360} fill="url(#stripes)" />

        {/* contorno do campo — quinas a 90° (sem rx) */}
        <SvgRect
          x={8}
          y={8}
          width={184}
          height={344}
          fill="none"
          stroke={LINE}
          strokeWidth={SW}
        />
        {/* linha do meio */}
        <SvgLine
          x1={8}
          y1={180}
          x2={192}
          y2={180}
          stroke={LINE}
          strokeWidth={SW}
        />
        {/* grande área superior + pequena área superior */}
        <SvgRect
          x={60}
          y={8}
          width={80}
          height={48}
          fill="none"
          stroke={LINE}
          strokeWidth={SW}
        />
        <SvgRect
          x={82}
          y={8}
          width={36}
          height={20}
          fill="none"
          stroke={LINE}
          strokeWidth={SW}
        />
        {/* grande área inferior + pequena área inferior */}
        <SvgRect
          x={60}
          y={304}
          width={80}
          height={48}
          fill="none"
          stroke={LINE}
          strokeWidth={SW}
        />
        <SvgRect
          x={82}
          y={332}
          width={36}
          height={20}
          fill="none"
          stroke={LINE}
          strokeWidth={SW}
        />
      </Svg>

      {/* Círculo central num SVG separado com preserveAspectRatio="meet":
          o backdrop acima usa "none" (estica listras/linhas pra preencher o
          campo), o que deformava o círculo numa elipse. Aqui o "meet" mantém
          a proporção 1:1 — o círculo fica redondo e centralizado no campo. */}
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 200 360"
        preserveAspectRatio="xMidYMid meet"
        style={StyleSheet.absoluteFill}
      >
        <SvgCircle
          cx={100}
          cy={180}
          r={42}
          fill="none"
          stroke={LINE}
          strokeWidth={SW}
        />
        <SvgCircle cx={100} cy={180} r={3} fill={LINE} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldBg: {
    ...StyleSheet.absoluteFillObject,
  },
});
