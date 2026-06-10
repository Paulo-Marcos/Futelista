import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

/**
 * Host singleton do `confirmAcao` customizado (M-12). Vive na raiz da
 * app via `myProviders` e expõe um Modal RN com botão destrutivo em
 * vermelho — o `window.confirm` nativo do browser não permite estilizar.
 *
 * Uso: `confirmAcao({ titulo, mensagem, destrutivo: true })` no
 * callsite continua igual. Internamente, no web/nativo, a função
 * empurra a requisição pra cá; se o host não estiver montado por
 * algum motivo, cai num fallback (window.confirm / Alert).
 */

export type OpcoesConfirm = {
  titulo: string;
  mensagem: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  destrutivo?: boolean;
};

type Pedido = {
  opcoes: OpcoesConfirm;
  resolve: (ok: boolean) => void;
};

let _handler: ((p: Pedido) => void) | null = null;

export function registrarConfirmAcaoHost(handler: ((p: Pedido) => void) | null) {
  _handler = handler;
}

export function temConfirmAcaoHost(): boolean {
  return _handler !== null;
}

export function pedirConfirmacao(opcoes: OpcoesConfirm): Promise<boolean> {
  return new Promise((resolve) => {
    if (!_handler) {
      resolve(false);
      return;
    }
    _handler({ opcoes, resolve });
  });
}

export function ConfirmAcaoHost() {
  const palette = usePalette();
  const [pedido, setPedido] = useState<Pedido | null>(null);

  useEffect(() => {
    registrarConfirmAcaoHost((p) => setPedido(p));
    return () => registrarConfirmAcaoHost(null);
  }, []);

  if (!pedido) return null;

  const {
    titulo,
    mensagem,
    textoConfirmar = "Confirmar",
    textoCancelar = "Cancelar",
    destrutivo,
  } = pedido.opcoes;

  const responder = (ok: boolean) => {
    const r = pedido.resolve;
    setPedido(null);
    r(ok);
  };

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      onRequestClose={() => responder(false)}
    >
      <Pressable
        style={[styles.backdrop, { backgroundColor: palette.shadow }]}
        onPress={() => responder(false)}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[
            styles.card,
            {
              backgroundColor: palette.surface,
              borderColor: palette.outlineVariant,
            },
          ]}
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
        >
          <Text style={[styles.titulo, { color: palette.onSurface }]}>
            {titulo}
          </Text>
          <Text
            style={[styles.mensagem, { color: palette.onSurfaceVariant }]}
            selectable
          >
            {mensagem}
          </Text>
          <View style={styles.acoes}>
            <Pressable
              onPress={() => responder(false)}
              accessibilityRole="button"
              accessibilityLabel={textoCancelar}
              style={({ pressed }) => [
                styles.btnSecundario,
                {
                  borderColor: palette.outline,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Text style={[styles.btnTextSecundario, { color: palette.onSurface }]}>
                {textoCancelar}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => responder(true)}
              accessibilityRole="button"
              accessibilityLabel={textoConfirmar}
              style={({ pressed }) => [
                styles.btnPrimario,
                {
                  backgroundColor: destrutivo
                    ? palette.error
                    : palette.primary,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.btnTextPrimario,
                  {
                    color: destrutivo ? palette.onError : palette.onPrimary,
                  },
                ]}
              >
                {textoConfirmar}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  titulo: {
    ...Typography.title,
    fontSize: 18,
    fontWeight: "800",
  },
  mensagem: {
    ...Typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  acoes: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  btnSecundario: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  btnTextSecundario: {
    ...Typography.label,
    fontWeight: "600",
  },
  btnPrimario: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  btnTextPrimario: {
    ...Typography.label,
    fontWeight: "700",
  },
});
