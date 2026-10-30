import { Alert, Platform } from "react-native";

import {
  pedirConfirmacao,
  pedirEscolha,
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
 * (ou `null` se cancelou).
 *
 * Caminho preferido: `ConfirmAcaoHost` — modal com todas as N opções
 * (D-050). Os diálogos nativos não servem como caminho principal: o
 * `Alert.alert` do Android só mostra 3 botões e o `window.confirm` da
 * web só tem OK/Cancelar.
 *
 * Fallback sem host: Alert em iOS/Android; na web, um `window.confirm`
 * por opção, em ordem — Cancelar segue para a próxima e, esgotadas,
 * resolve `null`. Nunca escolhe uma opção que o usuário não aceitou.
 */
export async function escolherOpcao<T extends string>(opcoes: {
  titulo: string;
  mensagem: string;
  opcoes: Escolha<T>[];
}): Promise<T | null> {
  if (temConfirmAcaoHost()) {
    // O host devolve um `valor` que veio de `opcoes.opcoes`, logo é um T.
    return (await pedirEscolha(opcoes)) as T | null;
  }
  if (Platform.OS === "web") return escolherPorConfirmSequencial(opcoes);
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

function escolherPorConfirmSequencial<T extends string>(opcoes: {
  titulo: string;
  mensagem: string;
  opcoes: Escolha<T>[];
}): T | null {
  if (typeof window === "undefined" || typeof window.confirm !== "function") {
    return null;
  }
  const principais = opcoes.opcoes.filter((o) => o.estilo !== "cancel");
  const escolhida = principais.find((o) =>
    window.confirm(`${opcoes.titulo}\n\n${opcoes.mensagem}\n\n${o.label}?`),
  );
  return escolhida?.valor ?? null;
}
