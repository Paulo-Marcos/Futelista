import { type ReactNode, useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

/**
 * Host singleton do `confirmAcao` e do `escolherOpcao` customizados
 * (M-12, D-050). Vive na raiz da app via `myProviders` e expõe um Modal
 * RN com botão destrutivo em vermelho — o `window.confirm` nativo do
 * browser não permite estilizar e só tem 2 botões, e o `Alert.alert`
 * do Android descarta tudo a partir do 4º botão.
 *
 * Uso: `confirmAcao(...)` / `escolherOpcao(...)` no callsite continuam
 * iguais. Internamente a função empurra a requisição pra cá; se o host
 * não estiver montado por algum motivo, cai num fallback
 * (window.confirm / Alert).
 */

export type OpcoesConfirm = {
  titulo: string;
  mensagem: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  destrutivo?: boolean;
};

export type OpcaoEscolha = {
  label: string;
  valor: string;
  estilo?: "default" | "cancel" | "destructive";
};

export type OpcoesEscolha = {
  titulo: string;
  mensagem: string;
  opcoes: OpcaoEscolha[];
};

type Pedido =
  | {
      tipo: "confirmacao";
      opcoes: OpcoesConfirm;
      resolve: (ok: boolean) => void;
    }
  | {
      tipo: "escolha";
      opcoes: OpcoesEscolha;
      resolve: (valor: string | null) => void;
    };

let _handler: ((p: Pedido) => void) | null = null;

export function registrarConfirmAcaoHost(
  handler: ((p: Pedido) => void) | null,
) {
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
    _handler({ tipo: "confirmacao", opcoes, resolve });
  });
}

/**
 * Resolve com o `valor` da opção tocada, ou `null` quando o usuário
 * cancela — por uma opção `estilo: "cancel"`, pelo backdrop ou pelo
 * botão voltar do Android.
 */
export function pedirEscolha(opcoes: OpcoesEscolha): Promise<string | null> {
  return new Promise((resolve) => {
    if (!_handler) {
      resolve(null);
      return;
    }
    _handler({ tipo: "escolha", opcoes, resolve });
  });
}

export function ConfirmAcaoHost() {
  const [pedido, setPedido] = useState<Pedido | null>(null);

  useEffect(() => {
    registrarConfirmAcaoHost((p) => setPedido(p));
    return () => registrarConfirmAcaoHost(null);
  }, []);

  if (!pedido) return null;

  if (pedido.tipo === "escolha") {
    const responder = (valor: string | null) => {
      setPedido(null);
      pedido.resolve(valor);
    };
    return <CardEscolha opcoes={pedido.opcoes} onResponder={responder} />;
  }

  const responder = (ok: boolean) => {
    setPedido(null);
    pedido.resolve(ok);
  };
  return <CardConfirmacao opcoes={pedido.opcoes} onResponder={responder} />;
}

function ModalDoHost({
  titulo,
  mensagem,
  onFechar,
  children,
}: {
  titulo: string;
  mensagem: string;
  onFechar: () => void;
  children: ReactNode;
}) {
  const palette = usePalette();
  return (
    <Modal transparent visible animationType="fade" onRequestClose={onFechar}>
      <Pressable
        style={[styles.backdrop, { backgroundColor: palette.shadow }]}
        onPress={onFechar}
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
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function CardConfirmacao({
  opcoes,
  onResponder,
}: {
  opcoes: OpcoesConfirm;
  onResponder: (ok: boolean) => void;
}) {
  const palette = usePalette();
  const {
    titulo,
    mensagem,
    textoConfirmar = "Confirmar",
    textoCancelar = "Cancelar",
    destrutivo,
  } = opcoes;

  return (
    <ModalDoHost
      titulo={titulo}
      mensagem={mensagem}
      onFechar={() => onResponder(false)}
    >
      <View style={styles.acoes}>
        <Pressable
          onPress={() => onResponder(false)}
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
          <Text
            style={[styles.btnTextSecundario, { color: palette.onSurface }]}
          >
            {textoCancelar}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onResponder(true)}
          accessibilityRole="button"
          accessibilityLabel={textoConfirmar}
          style={({ pressed }) => [
            styles.btnPrimario,
            {
              backgroundColor: destrutivo ? palette.error : palette.primary,
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
    </ModalDoHost>
  );
}

function CardEscolha({
  opcoes,
  onResponder,
}: {
  opcoes: OpcoesEscolha;
  onResponder: (valor: string | null) => void;
}) {
  const palette = usePalette();

  return (
    <ModalDoHost
      titulo={opcoes.titulo}
      mensagem={opcoes.mensagem}
      onFechar={() => onResponder(null)}
    >
      <View style={styles.listaOpcoes}>
        {opcoes.opcoes.map((o) => {
          const cancela = o.estilo === "cancel";
          return (
            <Pressable
              key={`${o.valor}-${o.label}`}
              onPress={() => onResponder(cancela ? null : o.valor)}
              accessibilityRole="button"
              accessibilityLabel={o.label}
              style={({ pressed }) => [
                styles.btnOpcao,
                {
                  borderColor: cancela
                    ? palette.outline
                    : palette.outlineVariant,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Text
                style={[
                  cancela ? styles.btnTextSecundario : styles.btnTextOpcao,
                  {
                    color:
                      o.estilo === "destructive"
                        ? palette.error
                        : palette.onSurface,
                  },
                ]}
              >
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ModalDoHost>
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
  // Escolha (D-050): opções empilhadas, porque N botões não cabem em linha.
  listaOpcoes: {
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  btnOpcao: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  btnTextOpcao: {
    ...Typography.label,
    fontWeight: "700",
  },
});
