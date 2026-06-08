import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePrefs } from "@/src/shared/prefs/prefsContext";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { Wordmark } from "@/src/shared/ui/Wordmark";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

/**
 * Onboarding inicial (F-16) — 3 slides estáticos com swipe horizontal
 * apresentando os 3 conceitos centrais: Pelada, Times, Partida.
 *
 * Disparado pelo gate em `app/_layout.tsx` quando `prefs.onboardingFeito`
 * é `false` e a hidratação do PrefsProvider já terminou. Também é
 * acessível depois via /configuracoes > Sobre → "Ver tour" (revisão).
 *
 * "Começar" e "Pular" gravam `onboardingFeito = true` e redirecionam
 * pra Home (router.replace — sem deixar a tela no histórico).
 */
type Slide = {
  id: "pelada" | "times" | "partida";
  icone: keyof typeof MaterialCommunityIcons.glyphMap;
  titulo: string;
  descricao: string;
};

const SLIDES: Slide[] = [
  {
    id: "pelada",
    icone: "soccer",
    titulo: "Cadastre sua pelada",
    descricao:
      "Salve nome, dia, local e regras uma vez. Toda semana é só iniciar a próxima execução.",
  },
  {
    id: "times",
    icone: "shuffle-variant",
    titulo: "Monte os times",
    descricao:
      "Adicione os jogadores, sorteie os times no modo que preferir e ajuste reservas no banco.",
  },
  {
    id: "partida",
    icone: "whistle",
    titulo: "Comande a partida",
    descricao:
      "Cronômetro, gols com 1 toque, fila de próximos automática. Vencedor fica, perdedor sai.",
  },
];

export default function OnboardingScreen() {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setPrefs } = usePrefs();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [pagina, setPagina] = useState(0);

  const eUltima = pagina === SLIDES.length - 1;

  const concluir = () => {
    setPrefs({ onboardingFeito: true });
    router.replace("/");
  };

  const avancar = () => {
    if (eUltima) {
      concluir();
      return;
    }
    const proxima = pagina + 1;
    scrollRef.current?.scrollTo({ x: proxima * width, animated: true });
    setPagina(proxima);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const indice = Math.round(x / Math.max(width, 1));
    if (indice !== pagina) setPagina(indice);
  };

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: palette.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.header}>
        <Wordmark size={20} />
        <Pressable
          onPress={concluir}
          accessibilityRole="button"
          accessibilityLabel="Pular tour"
          hitSlop={12}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Text style={[styles.pular, { color: palette.onSurfaceVariant }]}>
            Pular
          </Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {SLIDES.map((s) => (
          <SlideCard key={s.id} slide={s} width={width} palette={palette} />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View
              key={s.id}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === pagina ? palette.primary : palette.outlineVariant,
                  width: i === pagina ? 22 : 8,
                },
              ]}
            />
          ))}
        </View>

        <Pressable
          onPress={avancar}
          accessibilityRole="button"
          accessibilityLabel={eUltima ? "Começar" : "Próximo"}
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: palette.primary,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
          android_ripple={{ color: palette.onPrimary + "22" }}
        >
          <Text style={[styles.ctaText, { color: palette.onPrimary }]}>
            {eUltima ? "Começar" : "Próximo"}
          </Text>
          <MaterialCommunityIcons
            name={eUltima ? "check" : "arrow-right"}
            size={20}
            color={palette.onPrimary}
          />
        </Pressable>
      </View>
    </View>
  );
}

function SlideCard({
  slide,
  width,
  palette,
}: {
  slide: Slide;
  width: number;
  palette: ReturnType<typeof usePalette>;
}) {
  return (
    <View style={[styles.slide, { width }]}>
      <View
        style={[
          styles.iconBubble,
          {
            backgroundColor: palette.primary + "1F",
            borderColor: palette.primary + "55",
          },
        ]}
      >
        <MaterialCommunityIcons
          name={slide.icone}
          size={64}
          color={palette.primary}
        />
      </View>
      <Text
        style={[styles.titulo, { color: palette.onSurface }]}
        accessibilityRole="header"
      >
        {slide.titulo}
      </Text>
      <Text style={[styles.descricao, { color: palette.onSurfaceVariant }]}>
        {slide.descricao}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  pular: { ...Typography.label, fontSize: 13 },
  slide: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  iconBubble: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  titulo: {
    ...Typography.display,
    fontSize: 26,
    textAlign: "center",
  },
  descricao: {
    ...Typography.body,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.lg,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    height: 12,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderCurve: "continuous",
  },
  ctaText: { ...Typography.title, fontSize: 15, fontWeight: "800" },
});
