// 단어 공부 한 판의 규칙. 화면과 상관없는 순수 함수만.
// 한 단어를 서로 다른 방식으로 2번 맞히면 '외움'.
const ROUND1 = ['meaning', 'word', 'listen'];
const ALL = ['meaning', 'word', 'listen', 'spell', 'blank'];
const ALPHABET = [...'abcdefghijklmnopqrstuvwxyz'];
const norm = (x) => String(x).trim().toLowerCase();
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];

export function shuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createSession(set, rng = Math.random) {
  const firstMode = {};
  const round1 = shuffle(set, rng).map((w) => {
    firstMode[w.id] = pick(ROUND1, rng);
    return { id: w.id, mode: firstMode[w.id] };
  });
  const round2 = shuffle(set, rng).map((w) => ({
    id: w.id,
    mode: pick(ALL.filter((m) => m !== firstMode[w.id]), rng),
  }));
  // 같은 단어가 연달아 나오지 않게
  if (round2.length > 1 && round2[0].id === round1[round1.length - 1].id) {
    [round2[0], round2[1]] = [round2[1], round2[0]];
  }
  return {
    set,
    queue: [...round1, ...round2],
    retried: {}, // 판 끝에 한 번 더 낸 단어
    correct: {}, // 단어 id → 맞힌 방식 목록
    wrongTwice: [], // 까먹기 몬스터 명단에 올릴 단어
    firstTryCorrect: 0,
    mistakes: 0,
    current: null, // 지금 답을 기다리는 문제
    matchDone: set.length < 3,
  };
}

export function makeChoices(word, pool, field, rng = Math.random, n = 4) {
  const seen = new Set([norm(word[field])]);
  const others = [];
  for (const w of shuffle(pool, rng)) {
    if (others.length === n - 1) break;
    const key = norm(w[field]);
    if (w.id === word.id || seen.has(key)) continue;
    seen.add(key);
    others.push(w);
  }
  return shuffle([word, ...others], rng);
}

export function blankSentence(w) {
  return w.ex.replace(new RegExp(`\\b${escapeRe(w.word)}\\b`, 'i'), '____');
}

// 철자 조각: 4글자 이하는 전부, 5~7글자는 2칸, 8글자 이상은 3칸을 비운다
export function makeSpell(text, rng = Math.random) {
  const letters = [...text];
  const idx = letters.map((c, i) => (/[a-z]/i.test(c) ? i : -1)).filter((i) => i >= 0);
  const count = idx.length <= 4 ? idx.length : idx.length <= 7 ? 2 : 3;
  const blanks = shuffle(idx, rng).slice(0, count).sort((a, b) => a - b);
  const answer = blanks.map((i) => letters[i].toLowerCase());
  const decoys = shuffle(ALPHABET, rng).filter((c) => !answer.includes(c)).slice(0, 2);
  return { letters, blanks, tiles: shuffle([...answer, ...decoys], rng) };
}

export function checkSpell(q, picked) {
  return picked.join('') === q.blanks.map((i) => q.letters[i].toLowerCase()).join('');
}

// 다음 문제. 답하기 전에는 같은 문제를 돌려준다(연타 방지). 없으면 null
export function nextQuestion(s, pool, rng = Math.random) {
  if (s.current) return s.current;
  const item = s.queue.shift();
  if (!item) return null;
  const word = s.set.find((w) => w.id === item.id);
  const q = { mode: item.mode, word, retry: Boolean(item.retry) };
  if (item.mode === 'spell') Object.assign(q, makeSpell(word.word, rng));
  else q.choices = makeChoices(word, pool, item.mode === 'meaning' ? 'ko' : 'word', rng);
  if (item.mode === 'blank') q.sentence = blankSentence(word);
  s.current = q;
  return q;
}

function addCorrect(s, id, mode) {
  const modes = (s.correct[id] ||= []);
  if (modes.includes(mode)) return false;
  modes.push(mode);
  return modes.length === 2;
}

export const isLearned = (s, id) => (s.correct[id] || []).length >= 2;

// 지금 문제에 답한다. learnedNow: 이번 답으로 처음 외움 / failed: 이번에 까먹기 명단에 올라감
export function answer(s, ok) {
  const q = s.current;
  if (!q) return { learnedNow: false, failed: false };
  s.current = null;
  const id = q.word.id;
  if (ok) {
    if (!q.retry) s.firstTryCorrect += 1;
    return { learnedNow: addCorrect(s, id, q.mode), failed: false };
  }
  s.mistakes += 1;
  if (!s.retried[id]) {
    s.retried[id] = true;
    s.queue.push({ id, mode: q.mode, retry: true });
    return { learnedNow: false, failed: false };
  }
  const failed = !s.wrongTwice.includes(id);
  if (failed) s.wrongTwice.push(id);
  return { learnedNow: false, failed };
}

// 낱개 문제가 다 끝났을 때만 짝 찾기를 낸다
export function matchQuestion(s, rng = Math.random) {
  if (s.matchDone || s.current || s.queue.length) return null;
  return { mode: 'match', words: shuffle(s.set, rng), meanings: shuffle(s.set, rng) };
}

// cleanIds: 실수 없이 짝을 맞춘 단어. 이번에 외움이 된 id를 돌려준다
export function finishMatch(s, cleanIds, mistakes = 0) {
  s.matchDone = true;
  s.mistakes += mistakes;
  return cleanIds.filter((id) => addCorrect(s, id, 'match'));
}

export const isDone = (s) => !s.current && s.queue.length === 0 && s.matchDone;

export function summary(s) {
  return {
    learned: s.set.filter((w) => isLearned(s, w.id)).map((w) => w.id),
    wrong: s.wrongTwice.slice(),
    firstTryCorrect: s.firstTryCorrect,
    perfect: s.mistakes === 0,
  };
}
