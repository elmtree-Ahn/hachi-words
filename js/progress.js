// 진행 기록의 모양과 규칙. 화면·저장소와 상관없는 순수 함수만.
import { yearAt } from './timeline.js';

export const STATE_VERSION = 1;

export function defaultState() {
  return {
    v: STATE_VERSION,
    pin: null, // 아빠 화면 비밀번호 4자리
    hachiName: '',
    tutorialDone: false,
    learned: {}, // 단어 id → { d: 외운(마지막 복습) 날짜, s: 복습 단계 } — 복습은 2단계에서 쓴다
    wrong: {}, // 단어 id → 틀린 횟수 (까먹기 몬스터 명단)
    stars: 0,
    streak: { last: null, count: 0, best: 0 }, // 출석 불꽃
    today: { date: null, learned: 0 }, // 하루 최대를 세는 칸
    dailyMax: 30,
    seenCards: [], // 이미 본 역사 카드 id
    milestone: 0, // 축하를 마친 50단어 단위 (1 = 50단어)
  };
}

const isObj = (x) => Boolean(x) && typeof x === 'object' && !Array.isArray(x);

// 저장된 값은 믿지 않는다: 모양이 틀린 칸은 기본값으로 채운다
export function normalizeState(raw) {
  const base = defaultState();
  if (!isObj(raw)) return base;
  const s = { ...base, ...raw, v: STATE_VERSION };
  if (!isObj(s.learned)) s.learned = {};
  if (!isObj(s.wrong)) s.wrong = {};
  s.streak = isObj(s.streak) ? { ...base.streak, ...s.streak } : base.streak;
  if (!isObj(s.today)) s.today = base.today;
  if (!Array.isArray(s.seenCards)) s.seenCards = [];
  if (!Number.isFinite(s.stars) || s.stars < 0) s.stars = 0;
  if (!Number.isInteger(s.dailyMax) || s.dailyMax < 5 || s.dailyMax > 100) s.dailyMax = 30;
  if (!Number.isInteger(s.milestone) || s.milestone < 0) s.milestone = 0;
  if (typeof s.pin !== 'string' || !/^\d{4}$/.test(s.pin)) s.pin = null;
  if (typeof s.hachiName !== 'string') s.hachiName = '';
  s.tutorialDone = s.tutorialDone === true;
  return s;
}

const pad = (n) => String(n).padStart(2, '0');

// 폰 시계 기준 날짜 'YYYY-MM-DD'
export function localDate(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return localDate(new Date(y, m - 1, d + n));
}

export const learnedCount = (s) => Object.keys(s.learned).length;

export function ensureToday(s, today) {
  if (s.today.date !== today) s.today = { date: today, learned: 0 };
}

// 처음 외운 단어일 때만 true
export function markLearned(s, id, today) {
  if (s.learned[id]) return false;
  s.learned[id] = { d: today, s: 0 };
  ensureToday(s, today);
  s.today.learned += 1;
  return true;
}

export function canStudy(s, today) {
  const done = s.today.date === today ? s.today.learned : 0;
  return done < s.dailyMax;
}

export function nextSet(s, words, size = 5) {
  return words.filter((w) => !s.learned[w.id]).slice(0, size);
}

export function addWrong(s, id) {
  s.wrong[id] = (s.wrong[id] || 0) + 1;
}

// 한 판을 끝냈을 때: 출석 불꽃을 잇고 별을 준다. 받은 별 수를 돌려준다
export function finishSet(s, today, { firstTryCorrect, perfect }) {
  const { streak } = s;
  if (streak.last !== today) {
    streak.count = streak.last === addDays(today, -1) ? streak.count + 1 : 1;
    streak.last = today;
    streak.best = Math.max(streak.best, streak.count);
  }
  const stars = firstTryCorrect + (perfect ? 5 : 0);
  s.stars += stars;
  return stars;
}

// 홈에 보여 줄 불꽃: 오늘이나 어제 했으면 이어지고, 아니면 0
export function streakNow(s, today) {
  const { last, count } = s.streak;
  return last === today || last === addDays(today, -1) ? count : 0;
}

// 아직 축하하지 않은 50단어 단위 목록
export function newMilestones(s) {
  const reached = Math.floor(learnedCount(s) / 50);
  const out = [];
  for (let m = s.milestone + 1; m <= reached; m++) out.push(m);
  return out;
}

// 지금 연도까지 왔고 아직 안 본 역사 카드
export function pendingCards(s, cards) {
  const year = yearAt(learnedCount(s));
  return cards.filter((c) => c.year <= year && !s.seenCards.includes(c.id));
}

// 백업 파일 글자 → 기록. 기록 모양(learned 칸)이 아니면 null (지금 기록을 덮지 않게)
export function parseBackup(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  return isObj(raw) && isObj(raw.learned) ? normalizeState(raw) : null;
}
