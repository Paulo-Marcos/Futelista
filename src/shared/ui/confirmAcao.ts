import { Alert, Platform } from "react-native";

import {
  pedirConfirmacao,
  temConfirmAcaoHost,
} from "@/src/shared/ui/ConfirmAcaoHost";

type Opcoes = {
  titulo: string;
  mensagem: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  destrutivo?: boolean;
};

/**
 * Pede confirmação ao usuário e resolve `true` se ele confirmou.
 *
 * Caminho preferido: `ConfirmAcaoHost` (Modal RN customizado) — dá
 * controle visual real (botão destrutivo em vermelho, M-12). Quando
 * o host não está montado, cai pro `Alert.alert` nativo (iOS/Android)
 * ou `window.confirm` (web).
 */
export function confirmAcao(opcoes: Opcoes): Promise<boolean> {
  const {
    titulo,
    mensagem,
    textoConfirmar = "Confirmar",
    textoCancelar = "Cancelar",
    destrutivo,
  } = opcoes;

  if (temConfirmAcaoHost()) {
    return pedirConfirmacao({
      titulo,
      mensagem,
      textoConfirmar,
      textoCancelar,
      destrutivo,
    });
  }

  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && typeof window.confirm === "function") {
      return Promise.resolve(window.confirm(`${titulo}\n\n${mensagem}`));
    }
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    Alert.alert(titulo, mensagem, [
      {
        text: textoCancelar,
        style: "cancel",
        onPress: () => resolve(false),
      },
      {
        text: textoConfirmar,
        style: destrutivo ? "destructive" : "default",
        onPress: () => resolve(true),
      },
    ]);
  });
}

export type Escolha<T extends string> = {
  label: string;
  valor: T;
  estilo?: "default" | "cancel" | "destructive";
};

/**
 * Apresenta múltiplas opções ao usuário e resolve com a opção escolhida
 * (ou `null` se cancelou). Em iOS/Android usa Alert.alert com N botões;
 * em web cai num `window.confirm` simplificado (1ª opção via OK, 2ª via
 * Cancel — outras opções não cabem no confirm nativo).
 *
 * Para a pergunta clássica de 3 opções (cancelar/A/B), no web a opção
 * "cancelar" é inferida pelo fechamento do dialog.
 */
export function escolherOpcao<T extends string>(opcoes: {
  titulo: string;
  mensagem: string;
  opcoes: Escolha<T>[];
}): Promise<T | null> {
  if (Platform.OS === "web") {
    if (typeof window === "undefined" || typeof window.confirm !== "function") {
      return Promise.resolve(null);
    }
    const principais = opcoes.opcoes.filter((o) => o.estilo !== "cancel");
    if (principais.length === 0) return Promise.resolve(null);
    if (principais.length === 1) {
      const ok = window.confirm(`${opcoes.titulo}\n\n${opcoes.mensagem}`);
      return Promise.resolve(ok ? principais[0].valor : null);
    }
    const ok = window.confirm(
      `${opcoes.titulo}\n\n${opcoes.mensagem}\n\nOK = ${principais[0].label}, Cancelar = ${principais[1].label}`,
    );
    return Promise.resolve(ok ? principais[0].valor : principais[1].valor);
  }
  return new Promise((resolve) => {
    Alert.alert(
      opcoes.titulo,
      opcoes.mensagem,
      opcoes.opcoes.map((o) => ({
        text: o.label,
        style: o.estilo ?? "default",
        onPress: () => resolve(o.estilo === "cancel" ? null : o.valor),
      })),
    );
  });
}
