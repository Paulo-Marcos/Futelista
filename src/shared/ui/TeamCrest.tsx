import { useId } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Svg, {
  ClipPath,
  Defs,
  G,
  Path,
  Circle,
  Rect,
  Polygon,
} from "react-native-svg";

/**
 * TeamCrest — escudo procedural determinístico (sem marcas reais).
 *
 * Mesmo seed sempre produz o mesmo escudo. Atribuição:
 * (par de cores × padrão interno × emblema central).
 * Portado 1:1 de prototype/js/crests.jsx.
 */

const CREST_PALETTE: Array<[string, string]> = [
  ["#C62828", "#1C1C1E"],
  ["#1565C0", "#FFFFFF"],
  ["#2E7D32", "#FFFFFF"],
  ["#6A1B9A", "#FDD835"],
  ["#00838F", "#FFFFFF"],
  ["#EF6C00", "#1C1C1E"],
  ["#283593", "#C62828"],
  ["#37474F", "#ECEFF1"],
  ["#AD1457", "#FFFFFF"],
  ["#4E342E", "#FFD54F"],
  ["#00695C", "#FFFFFF"],
  ["#455A64", "#FF7043"],
];

type Pattern = "halves" | "bands" | "sash" | "stripe" | "hoops";
const CREST_PATTERNS: Pattern[] = ["halves", "bands", "sash", "stripe", "hoops"];

const SHIELD_PATH =
  "M24 2.5 L44 8.5 V27 C44 41.5 35.5 50 24 53.5 C12.5 50 4 41.5 4 27 V8.5 Z";
const STAR_PATH =
  "M24 16 l1.9 5.7 6 0 -4.9 3.6 1.9 5.7 -4.9 -3.5 -4.9 3.5 1.9 -5.7 -4.9 -3.6 6 0 Z";

function crestHash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function crestFor(seed: string): {
  c1: string;
  c2: string;
  pattern: Pattern;
  emblem: number;
} {
  const s = String(seed);
  const h = crestHash(s);
  const [c1, c2] = CREST_PALETTE[h % CREST_PALETTE.length];
  const pattern = CREST_PATTERNS[(h >> 5) % CREST_PATTERNS.length];
  const emblem = (h >> 9) % 3;
  return { c1, c2, pattern, emblem };
}

type TeamCrestProps = {
  seed: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  /**
   * Cor primária do escudo (F-18). Quando passada, sobrescreve `c1` do
   * `crestFor(seed)` — usado para refletir a `corCustom` que o usuário
   * escolheu no editor de time. `c2` (cor secundária) continua sendo
   * derivada da seed para preservar o emblema.
   */
  corOverride?: string;
};

export function TeamCrest({
  seed,
  size = 32,
  style,
  corOverride,
}: TeamCrestProps) {
  const { c1: c1Seed, c2, pattern, emblem } = crestFor(seed);
  const c1 = corOverride ?? c1Seed;
  // ID único por instância. Não pode depender só de `seed`: o mesmo time
  // aparece em vários TeamCrest simultaneamente (placar + mini-placar + lista
  // de próximos), e <ClipPath id="cr…"> duplicado dentro do mesmo documento
  // SVG quebra o recorte do escudo em react-native-svg ao voltar de outra tab
  // (instância antiga "vence" e o fill colorido aparece sem o path do shield,
  // produzindo um retângulo). useId() garante unicidade por componente.
  const reactId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const cid = "cr" + reactId;
  const height = Math.round((size * 56) / 48);

  return (
    <Svg
      width={size}
      height={height}
      viewBox="0 0 48 56"
      style={style}
      aria-hidden
    >
      <Defs>
        <ClipPath id={cid}>
          <Path d={SHIELD_PATH} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${cid})`}>
        <Rect width="48" height="56" fill={c1} />
        <PatternFill pattern={pattern} c2={c2} />
        <Rect width="48" height="20" fill="#FFFFFF" opacity={0.07} />
      </G>
      <Emblem emblem={emblem} />
      <Path
        d={SHIELD_PATH}
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth={1.6}
      />
    </Svg>
  );
}

function PatternFill({ pattern, c2 }: { pattern: Pattern; c2: string }) {
  switch (pattern) {
    case "halves":
      return <Rect x="24" y="0" width="24" height="56" fill={c2} />;
    case "bands":
      return (
        <G fill={c2}>
          <Rect y="11" width="48" height="9" />
          <Rect y="29" width="48" height="9" />
        </G>
      );
    case "sash":
      return <Polygon points="0,38 0,52 48,18 48,4" fill={c2} />;
    case "stripe":
      return <Rect x="19" y="0" width="10" height="56" fill={c2} />;
    case "hoops":
      return (
        <G fill={c2}>
          <Rect y="6" width="48" height="6" />
          <Rect y="22" width="48" height="6" />
          <Rect y="38" width="48" height="6" />
        </G>
      );
  }
}

function Emblem({ emblem }: { emblem: number }) {
  if (emblem === 0) {
    return <Path d={STAR_PATH} fill="#FFFFFF" opacity={0.95} />;
  }
  if (emblem === 1) {
    return (
      <G>
        <Circle
          cx="24"
          cy="24"
          r="6.5"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={2.4}
          opacity={0.95}
        />
        <Circle cx="24" cy="24" r="1.8" fill="#FFFFFF" />
      </G>
    );
  }
  return null;
}
