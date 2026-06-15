import React, { useCallback, useEffect, useRef, useState } from "react";

/**
 * Moldura de celular para a versão **web** do app.
 *
 * O FuteLista foi desenhado na proporção de um celular. Na web, sem nenhuma
 * restrição, o `GestureHandlerRootView` (flex:1) estica a UI para a janela
 * inteira e a tela fica "desconfigurada" em monitores largos. Este componente
 * resolve isso: renderiza o app dentro de uma moldura com tamanho inicial de
 * celular e oferece alças para a pessoa **arrastar e ajustar largura e altura**.
 *
 * Detalhes que justificam as decisões:
 * - É `.web.tsx`: no nativo o `myProviders.tsx` nem importa este arquivo.
 * - SSR-safe: o Static Rendering do Expo roda o componente no Node (sem
 *   `window`). Por isso a moldura só "liga" depois do mount no cliente
 *   (`mounted`), evitando mismatch de hidratação.
 * - `transform` na moldura cria um containing block: assim os modais do app
 *   (`presentation: "formSheet"`, Splash, ConfirmAcaoHost), que usam
 *   `position: fixed`, ficam **contidos** dentro da moldura em vez de cobrir a
 *   janela toda.
 * - Em telas estreitas (web em celular) a moldura se desliga e o app ocupa tudo.
 */

const STORAGE_KEY = "futelista:webFrameSize";

// Tamanho inicial: proporção de um celular comum (iPhone 14 ~ 390x844).
const DEFAULT_WIDTH = 390;
const DEFAULT_HEIGHT = 844;

const MIN_WIDTH = 300;
const MIN_HEIGHT = 480;

// Respiro entre a moldura e as bordas da janela + espaço da barrinha de controle.
const FRAME_MARGIN = 24;
const TOPBAR = 34;

// Abaixo desta largura tratamos como "web mobile": sem moldura, ocupa tudo.
const BYPASS_BREAKPOINT = 760;

type Size = { width: number; height: number };
type Axis = "x" | "y" | "both";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

const maxWidth = () => window.innerWidth - FRAME_MARGIN * 2;
const maxHeight = () => window.innerHeight - FRAME_MARGIN * 2 - TOPBAR;

function readStoredSize(): Size {
  if (typeof window === "undefined") {
    return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Size>;
      if (
        typeof parsed.width === "number" &&
        typeof parsed.height === "number"
      ) {
        return { width: parsed.width, height: parsed.height };
      }
    }
  } catch {
    // localStorage indisponível/corrompido → cai no default.
  }
  return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
}

export const WebPhoneFrame = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  const [compact, setCompact] = useState(false);
  const [dark, setDark] = useState(false);
  const [size, setSize] = useState<Size>(readStoredSize);

  // `sizeRef` espelha o tamanho atual para o pointerup persistir sem depender
  // de fechar sobre um `size` defasado.
  const sizeRef = useRef(size);
  sizeRef.current = size;
  const dragRef = useRef<{
    axis: Axis;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  } | null>(null);

  useEffect(() => setMounted(true), []);

  // Acompanha o esquema de cores para o fundo "fora da moldura".
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setDark(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Detecta web mobile e mantém a moldura dentro da janela ao redimensioná-la.
  useEffect(() => {
    const onResize = () => {
      setCompact(
        window.innerWidth < BYPASS_BREAKPOINT ||
          window.innerHeight < MIN_HEIGHT + TOPBAR,
      );
      setSize((s) => ({
        width: clamp(s.width, MIN_WIDTH, maxWidth()),
        height: clamp(s.height, MIN_HEIGHT, maxHeight()),
      }));
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const persist = useCallback((next: Size) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Persistência é só conveniência; ignore se o storage falhar.
    }
  }, []);

  const onPointerDown = useCallback(
    (axis: Axis) => (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      dragRef.current = {
        axis,
        startX: e.clientX,
        startY: e.clientY,
        startW: sizeRef.current.width,
        startH: sizeRef.current.height,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
      document.body.style.userSelect = "none";
    },
    [],
  );

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const next: Size = { ...sizeRef.current };
    if (drag.axis === "x" || drag.axis === "both") {
      next.width = clamp(
        drag.startW + (e.clientX - drag.startX),
        MIN_WIDTH,
        maxWidth(),
      );
    }
    if (drag.axis === "y" || drag.axis === "both") {
      next.height = clamp(
        drag.startH + (e.clientY - drag.startY),
        MIN_HEIGHT,
        maxHeight(),
      );
    }
    setSize(next);
  }, []);

  const onPointerUp = useCallback(() => {
    if (!dragRef.current) return;
    dragRef.current = null;
    document.body.style.userSelect = "";
    persist(sizeRef.current);
  }, [persist]);

  const reset = useCallback(() => {
    const next: Size = {
      width: clamp(DEFAULT_WIDTH, MIN_WIDTH, maxWidth()),
      height: clamp(DEFAULT_HEIGHT, MIN_HEIGHT, maxHeight()),
    };
    setSize(next);
    persist(next);
  }, [persist]);

  // Antes do mount (inclui SSR) e em telas estreitas: app ocupa tudo, sem moldura.
  if (!mounted || compact) {
    return <>{children}</>;
  }

  const c = palette(dark);

  return (
    <div style={{ ...styles.backdrop, background: c.backdrop }}>
      <div style={{ ...styles.stage, width: size.width, height: size.height }}>
        <div style={styles.topbar}>
          <span style={{ ...styles.sizeLabel, color: c.label }}>
            {Math.round(size.width)} × {Math.round(size.height)}
          </span>
          <button
            type="button"
            onClick={reset}
            title="Voltar ao tamanho de celular"
            style={{
              ...styles.resetButton,
              color: c.label,
              borderColor: c.handle,
            }}
          >
            Tamanho celular
          </button>
        </div>

        <div
          style={{
            ...styles.frame,
            borderColor: c.frameBorder,
            boxShadow: c.shadow,
          }}
        >
          {children}
        </div>

        <div
          role="separator"
          aria-label="Ajustar largura"
          title="Arraste para ajustar a largura"
          onPointerDown={onPointerDown("x")}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{ ...styles.handleRight, background: c.handle }}
        />
        <div
          role="separator"
          aria-label="Ajustar altura"
          title="Arraste para ajustar a altura"
          onPointerDown={onPointerDown("y")}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{ ...styles.handleBottom, background: c.handle }}
        />
        <div
          role="separator"
          aria-label="Ajustar largura e altura"
          title="Arraste para ajustar largura e altura"
          onPointerDown={onPointerDown("both")}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{ ...styles.handleCorner, background: c.handleStrong }}
        />
      </div>
    </div>
  );
};

function palette(dark: boolean) {
  return dark
    ? {
        backdrop: "#050506",
        label: "#9aa0aa",
        handle: "rgba(255,255,255,0.18)",
        handleStrong: "rgba(255,255,255,0.32)",
        frameBorder: "rgba(255,255,255,0.10)",
        shadow: "0 24px 70px rgba(0,0,0,0.6)",
      }
    : {
        backdrop: "#e8eaef",
        label: "#5b616b",
        handle: "rgba(0,0,0,0.16)",
        handleStrong: "rgba(0,0,0,0.30)",
        frameBorder: "rgba(0,0,0,0.08)",
        shadow: "0 24px 70px rgba(0,0,0,0.22)",
      };
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  stage: {
    position: "relative",
    paddingTop: TOPBAR,
    boxSizing: "border-box",
  },
  topbar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: TOPBAR,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 8,
  },
  sizeLabel: {
    fontSize: 12,
    fontVariantNumeric: "tabular-nums",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  resetButton: {
    fontSize: 12,
    lineHeight: "16px",
    background: "transparent",
    border: "1px solid",
    borderRadius: 999,
    padding: "3px 10px",
    cursor: "pointer",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  frame: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: TOPBAR,
    overflow: "hidden",
    borderRadius: 28,
    borderWidth: 1,
    borderStyle: "solid",
    // Cria containing block → modais `position: fixed` ficam dentro da moldura.
    transform: "translateZ(0)",
    display: "flex",
  },
  handleRight: {
    position: "absolute",
    top: "50%",
    right: -8,
    transform: "translateY(-50%)",
    width: 10,
    height: 72,
    borderRadius: 6,
    cursor: "ew-resize",
    touchAction: "none",
    zIndex: 10,
  },
  handleBottom: {
    position: "absolute",
    left: "50%",
    bottom: -8,
    transform: "translateX(-50%)",
    width: 72,
    height: 10,
    borderRadius: 6,
    cursor: "ns-resize",
    touchAction: "none",
    zIndex: 10,
  },
  handleCorner: {
    position: "absolute",
    right: -9,
    bottom: -9,
    width: 22,
    height: 22,
    borderRadius: 7,
    cursor: "nwse-resize",
    touchAction: "none",
    zIndex: 11,
  },
};
