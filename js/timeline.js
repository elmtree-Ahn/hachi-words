// 시대별 시간 흐름. 0년은 없다(기원전 1년 다음은 1년).
export const ERAS = [
  { id: 'gojoseon', name: '고조선', start: -2333, end: -57, words: 150 },
  { id: 'samguk', name: '삼국', start: -57, end: 676, words: 400 },
  { id: 'nambuk', name: '통일신라·발해', start: 676, end: 918, words: 200 },
  { id: 'goryeo', name: '고려', start: 918, end: 1392, words: 450 },
  { id: 'joseon', name: '조선', start: 1392, end: 1876, words: 550 },
  { id: 'modern', name: '근현대', start: 1876, end: 2026, words: 250 },
];
export const TOTAL_WORDS = ERAS.reduce((sum, e) => sum + e.words, 0);

// 계산할 때만 0년이 있는 수직선으로 바꾼다 (기원전 1년 = 0)
const toAstro = (y) => (y < 0 ? y + 1 : y);
const fromAstro = (a) => (a <= 0 ? a - 1 : a);
const clampCount = (n) => Math.max(0, Math.min(TOTAL_WORDS, Math.floor(n)));

// 외운 단어 n개일 때의 연도
export function yearAt(n) {
  n = clampCount(n);
  let before = 0;
  for (const e of ERAS) {
    if (n <= before + e.words) {
      const a0 = toAstro(e.start);
      const a1 = toAstro(e.end);
      return fromAstro(a0 + Math.round(((n - before) * (a1 - a0)) / e.words));
    }
    before += e.words;
  }
}

// 외운 단어 n개일 때 있는 시대 (시대 끝 단어를 외우면 다음 시대로 넘어간다)
export function eraIndexAt(n) {
  n = clampCount(n);
  let before = 0;
  for (let i = 0; i < ERAS.length; i++) {
    before += ERAS[i].words;
    if (n < before) return i;
  }
  return ERAS.length - 1;
}

export function formatYear(y) {
  return y < 0 ? `기원전 ${-y}년` : `${y}년`;
}
