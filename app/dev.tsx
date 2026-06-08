import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useSoccer } from "@/src/app-shell/useSoccer";
import {
  CENARIOS,
  CenarioId,
  devAplicarCenario,
  devLimparStorage,
} from "@/src/app-shell/devSeed";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { SecondaryButton } from "@/src/shared/ui/SecondaryButton";
import { Spacing, Typography } from "@/src/shared/theme/Colors";

/**
 * Painel de desenvolvimento. Permite limpar o storage e aplicar
 * cenários pré-fabricados para testar a UI rápido.
 *
 * Após qualquer ação, recarrega o app via `router.replace("/")` —
 * o provider re-faz boot e detecta o novo estado.
 */
export default function DevScreen() {
  const palette = usePalette();
  const router = useRouter();
  const { repositorio, exportarBackup } = useSoccer();
  const [executando, setExecutando] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const reload = () => {
    setMensagem("Aplicado. Recarregando…");
    // Fecha o modal e força re-mount do provider via troca de rota.
    router.replace("/");
  };

  const aplicar = (id: CenarioId, titulo: string) => {
    if (executando) return;
    setExecutando(titulo);
    setMensagem(null);
    devAplicarCenario(repositorio, id)
      .then(reload)
      .catch((e) => {
        setMensagem(`Erro: ${e instanceof Error ? e.message : String(e)}`);
        setExecutando(null);
      });
  };

  const limpar = () => {
    if (executando) return;
    setExecutando("Limpar storage");
    setMensagem(null);
    devLimparStorage()
      .then(reload)
      .catch((e) => {
        setMensagem(`Erro: ${e instanceof Error ? e.message : String(e)}`);
        setExecutando(null);
      });
  };

  /**
   * Backup JSON pra Share.share — o usuário escolhe destino (Drive,
   * email, WhatsApp). Cancelar o share não é tratado como erro.
   * Importar de volta fica como follow-up (F-14b).
   */
  const exportar = async () => {
    if (executando) return;
    setExecutando("Exportar backup");
    setMensagem(null);
    try {
      const json = await exportarBackup();
      await Share.share({
        message: json,
        title: "Backup FuteLista",
      });
      setMensagem("Backup exportado.");
    } catch (e) {
      setMensagem(`Erro: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setExecutando(null);
    }
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: palette.onSurface }]}>
          🛠 Dev tools
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          hitSlop={8}
        >
          <MaterialCommunityIcons
            name="close"
            size={22}
            color={palette.onSurface}
          />
        </Pressable>
      </View>

      <Text style={[styles.intro, { color: palette.onSurfaceVariant }]}>
        Ferramentas temporárias para popular o app e testar a UI. Cada ação é
        destrutiva: limpa o storage antes de aplicar o cenário.
      </Text>

      <View style={styles.block}>
        <Text
          style={[styles.sectionTitle, { color: palette.onSurfaceVariant }]}
        >
          Ações
        </Text>
        <SecondaryButton
          label="Exportar backup (JSON)"
          icon="share-variant"
          onPress={exportar}
          fullWidth
          disabled={executando !== null}
        />
        <SecondaryButton
          label="Limpar storage (zerar tudo)"
          icon="delete-sweep"
          onPress={limpar}
          destructive
          fullWidth
          disabled={executando !== null}
        />
        <SecondaryButton
          label="Inspecionar splash (loop)"
          icon="eye-outline"
          onPress={() => router.push("/splash-preview")}
          fullWidth
        />
      </View>

      <View style={styles.block}>
        <Text
          style={[styles.sectionTitle, { color: palette.onSurfaceVariant }]}
        >
          Cenários
        </Text>
        {CENARIOS.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => aplicar(c.id, c.titulo)}
            disabled={executando !== null}
            accessibilityRole="button"
            accessibilityLabel={`Aplicar cenário ${c.titulo}`}
            style={({ pressed }) => [
              styles.cenarioCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.outlineVariant,
                opacity:
                  executando !== null && executando !== c.titulo
                    ? 0.45
                    : pressed
                      ? 0.85
                      : 1,
              },
            ]}
            android_ripple={{ color: palette.primary + "22" }}
          >
            <Text style={[styles.cenarioTitulo, { color: palette.onSurface }]}>
              {c.titulo}
            </Text>
            <Text
              style={[
                styles.cenarioDescricao,
                { color: palette.onSurfaceVariant },
              ]}
            >
              {c.descricao}
            </Text>
          </Pressable>
        ))}
      </View>

      {executando ? (
        <View style={styles.statusRow}>
          <ActivityIndicator size="small" color={palette.primary} />
          <Text
            style={[styles.statusText, { color: palette.onSurfaceVariant }]}
          >
            {executando}…
          </Text>
        </View>
      ) : null}

      {mensagem ? (
        <Text style={[styles.mensagem, { color: palette.onSurface }]}>
          {mensagem}
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.md },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { ...Typography.headline },
  closeButton: { padding: 8, borderRadius: 20 },
  intro: { ...Typography.body, fontSize: 13 },
  block: { gap: Spacing.sm },
  sectionTitle: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Card de cenário virou Pressable diretamente — antes o Pressable estava
  // dentro de um Card (View), e clicks no padding do Card não disparavam.
  cenarioCard: {
    padding: Spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderCurve: "continuous",
  },
  cenarioTitulo: { ...Typography.title, fontSize: 15 },
  cenarioDescricao: { ...Typography.body, fontSize: 13, marginTop: 2 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  statusText: { ...Typography.label },
  mensagem: { ...Typography.label, marginTop: Spacing.sm },
});
