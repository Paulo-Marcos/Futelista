import React from "react";

/**
 * Fallback nativo do `WebPhoneFrame`.
 *
 * A moldura de celular só faz sentido na web (ver `WebPhoneFrame.web.tsx`).
 * No iOS/Android o app já roda em tela de celular, então aqui é apenas um
 * passthrough. Este arquivo existe também para o `tsc` resolver o import — o
 * Metro escolhe a versão `.web.tsx` ao empacotar para web.
 */
export const WebPhoneFrame = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};
