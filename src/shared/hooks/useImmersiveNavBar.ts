import * as NavigationBar from "expo-navigation-bar";
import { useEffect } from "react";
import { AppState, Keyboard, Platform } from "react-native";

/**
 * Mantém oculta a barra de navegação do sistema (voltar / home / recentes) no
 * Android, reaplicando a ocultação sempre que o SO a reexibe.
 *
 * Por que reaplicar — e não esconder uma vez só:
 * - No SDK 54 o **edge-to-edge** é obrigatório no Android. Sob ele,
 *   `setBehaviorAsync("overlay-swipe")` vira no-op (emite só um warning), então
 *   não dá para delegar ao SO o "reaparece no swipe e some sozinha". Sem esse
 *   comportamento, o default do sistema reexibe a barra e a deixa **fixa** —
 *   exatamente o bug observado.
 * - A correção robusta em JS é reaplicar `hidden` nos momentos em que o SO
 *   força a barra de volta: app voltando do background, teclado fechando e
 *   qualquer reexibição da barra (swipe, troca de rota, gesto do sistema).
 *
 * `addVisibilityListener` é o gatilho mais abrangente: dispara quando a barra
 * fica visível por qualquer motivo, e ao reesconder ali realizamos o
 * "reaparece no swipe e some de novo" sem depender do edge-to-edge.
 * `AppState` e `Keyboard` são reforços idempotentes para cenários que o
 * listener possa não cobrir em todos os fabricantes.
 *
 * Responsabilidade única: manter a barra escondida. Não causa re-render (efeito
 * puramente imperativo) e remove todos os listeners no cleanup.
 */
export function useImmersiveNavBar(): void {
  useEffect(() => {
    if (Platform.OS !== "android") return;

    const hide = () => {
      // Fire-and-forget: a promise só rejeita em plataforma sem suporte, que o
      // guard acima já exclui. O catch evita "unhandled rejection" defensivo.
      NavigationBar.setVisibilityAsync("hidden").catch(() => {});
    };

    hide();

    const visibilitySub = NavigationBar.addVisibilityListener(
      ({ visibility }) => {
        if (visibility === "visible") hide();
      },
    );
    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active") hide();
    });
    const keyboardSub = Keyboard.addListener("keyboardDidHide", hide);

    return () => {
      visibilitySub.remove();
      appStateSub.remove();
      keyboardSub.remove();
    };
  }, []);
}
