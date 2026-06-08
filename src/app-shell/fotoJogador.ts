import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";

/**
 * Helpers de foto do jogador (F-19).
 *
 * Fluxo: usuário escolhe foto via `ImagePicker` (câmera ou galeria) →
 * copiamos o arquivo selecionado pra `FileSystem.documentDirectory` →
 * gravamos só o URI persistente em `Player.fotoUri`. Por que copiar?
 * URIs retornados pelo picker (especialmente na galeria do Android)
 * podem expirar quando o usuário apaga a foto ou o sistema limpa o
 * cache de transição. O sandbox do app sobrevive até desinstalação.
 *
 * Nomeamos cada cópia com o id do jogador + timestamp pra evitar
 * colisões e facilitar limpeza por arquivo.
 */

const FOTOS_DIR =
  (FileSystem.documentDirectory ?? "") + "fotos-jogadores/";

/**
 * Garante que a pasta existe. Idempotente.
 */
async function garantirPasta(): Promise<void> {
  if (!FileSystem.documentDirectory) return;
  const info = await FileSystem.getInfoAsync(FOTOS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(FOTOS_DIR, { intermediates: true });
  }
}

/**
 * Origem do picker — câmera ou galeria. Cada uma exige uma permissão
 * diferente e tem método dedicado no expo-image-picker.
 */
export type OrigemFoto = "camera" | "galeria";

/**
 * Abre o picker, espera o usuário escolher (ou cancelar), copia o
 * arquivo pro sandbox e devolve o URI final. Retorna `null` quando o
 * usuário cancela ou a permissão é negada.
 */
export async function escolherFotoDoJogador(
  jogadorId: string,
  origem: OrigemFoto,
): Promise<string | null> {
  const permissao =
    origem === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissao.granted) return null;

  const opcoes: ImagePicker.ImagePickerOptions = {
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  };
  const resultado =
    origem === "camera"
      ? await ImagePicker.launchCameraAsync(opcoes)
      : await ImagePicker.launchImageLibraryAsync(opcoes);

  if (resultado.canceled || resultado.assets.length === 0) return null;

  const fonte = resultado.assets[0].uri;
  await garantirPasta();
  const extensao = inferirExtensao(fonte);
  const destino = `${FOTOS_DIR}${jogadorId}-${Date.now()}${extensao}`;
  await FileSystem.copyAsync({ from: fonte, to: destino });
  return destino;
}

/**
 * Deleta uma foto do sandbox. Idempotente — não falha se o arquivo já
 * não existe. Útil quando o usuário troca a foto (deletamos a antiga
 * pra não acumular lixo) ou remove de vez.
 */
export async function apagarFotoDoJogador(uri: string): Promise<void> {
  if (!uri.startsWith("file://")) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Silencioso — limpeza é best-effort.
  }
}

/** Extrai a extensão do nome do arquivo, ou ".jpg" como fallback. */
function inferirExtensao(uri: string): string {
  const semQuery = uri.split("?")[0];
  const m = /\.([a-zA-Z0-9]+)$/.exec(semQuery);
  if (!m) return ".jpg";
  const ext = m[1].toLowerCase();
  // Whitelist conservadora pra evitar caracteres suspeitos no filename.
  if (["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(ext)) {
    return `.${ext}`;
  }
  return ".jpg";
}
