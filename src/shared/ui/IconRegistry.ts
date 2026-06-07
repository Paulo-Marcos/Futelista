/**
 * IconRegistry — mapa semântico → glifo Material Community Icons.
 *
 * Direto do handoff §4 (Ícones): nenhum emoji na UI, **um único conjunto**
 * (MDI via `@expo/vector-icons` no RN). Cada papel do app aponta para um
 * nome semântico; a tradução para o glifo concreto vive aqui.
 *
 * Trocar o glifo de um papel (ex.: `goal`) altera o app inteiro sem
 * caçada por strings espalhadas.
 */

export const ICON_GLYPHS = {
  // Futebol / partida
  ball: "soccer",
  whistle: "whistle",
  field: "soccer-field",
  boot: "shoe-cleat",
  jersey: "tshirt-crew",
  goal: "soccer",
  scoreboard: "scoreboard",
  trophy: "trophy",
  medal: "medal",
  stadium: "stadium-variant",
  grass: "grass",
  target: "bullseye-arrow",
  card: "card",
  swap: "account-switch",
  bench: "seat-outline",
  fire: "fire",
  flag: "flag-checkered",

  // Tempo
  timer: "timer-outline",
  stopwatch: "timer-sand",
  clock: "clock-outline",
  clock2: "clock-time-four-outline",

  // Pessoas
  players: "account-multiple",
  accountPlus: "account-plus",
  account: "account",
  camera: "camera-outline",
  emoticon: "emoticon-happy-outline",

  // Navegação / shell
  home: "view-dashboard-outline",
  history: "history",
  rules: "clipboard-text-outline",
  calendar: "calendar-outline",
  mapPin: "map-marker-outline",
  note: "note-text-outline",

  // Escudos
  shield: "shield-outline",
  shieldFill: "shield",
  shieldAccount: "shield-account",

  // Controles
  plus: "plus",
  minus: "minus",
  search: "magnify",
  play: "play",
  pause: "pause",
  stop: "stop",
  back: "arrow-left",
  chevron: "chevron-right",
  arrowRight: "arrow-right",
  cog: "cog-outline",
  close: "close",
  check: "check",
  checkCircle: "check-circle",
  pencil: "pencil-outline",
  dice: "dice-multiple",
  bolt: "lightning-bolt",
  dots: "dots-vertical",
  repeat: "swap-horizontal",
} as const;

export type IconName = keyof typeof ICON_GLYPHS;
export type IconGlyph = (typeof ICON_GLYPHS)[IconName];

export function glyphFor(name: IconName): IconGlyph {
  return ICON_GLYPHS[name];
}
