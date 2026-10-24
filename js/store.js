// 폰 안 저장소(Capacitor Preferences)에 기록 전체를 JSON 하나로 저장한다
import { defaultState, normalizeState } from './progress.js';

const KEY = 'hachi.state';
const P = globalThis.capacitorPreferences.Preferences;
let chain = Promise.resolve();

export async function load() {
  const { value } = await P.get({ key: KEY });
  if (value == null) return defaultState();
  try {
    return normalizeState(JSON.parse(value));
  } catch {
    // 깨진 기록은 지우지 않고 따로 남긴다 (나중에 맥에서 살펴볼 수 있게)
    await P.set({ key: `${KEY}.broken.${Date.now()}`, value });
    return defaultState();
  }
}

// 저장은 부른 순서대로 한다 (빨리 여러 번 불러도 옛 값이 새 값을 덮지 않게)
export function save(state) {
  state.savedAt = Date.now(); // 아빠 화면 '마지막 저장'용
  const value = JSON.stringify(state);
  chain = chain.then(() => P.set({ key: KEY, value })).catch(() => {});
  return chain;
}
