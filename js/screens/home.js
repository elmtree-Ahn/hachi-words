import { h, toast } from '../ui.js';
import { hachiSVG, sceneSVG, flameSVG } from '../art.js';
import { ERAS, TOTAL_WORDS, yearAt, eraIndexAt, formatYear } from '../timeline.js';
import { learnedCount, streakNow, canStudy, nextSet, localDate, newMilestones, pendingCards } from '../progress.js';
import { pinPad, setPin, showCards, celebrate } from '../popups.js';

export function home(app) {
  const { state, words, cards } = app;
  const today = localDate();
  const count = learnedCount(state);
  const era = ERAS[eraIndexAt(count)];
  const streak = streakNow(state, today);
  const note = nextSet(state, words).length === 0 ? '다음 단어는 곧 와요!'
    : !canStudy(state, today) ? '오늘은 여기까지! 내일 또 만나' : null;
  const soon = (name) => h('button', { class: 'locked', onclick: () => toast(`${name} — 곧 열려요!`) }, `🔒 ${name}`);

  async function openDad() {
    if (!state.pin) {
      await setPin(state, app.save);
      app.go('dad');
      return;
    }
    const pin = await pinPad('아빠 비밀번호');
    if (pin === state.pin) app.go('dad');
    else if (pin) toast('비밀번호가 달라요');
  }

  const el = h('div', { class: 'screen home' },
    h('div', { class: 'scene-wrap', html: sceneSVG(era.id) }),
    h('header', { class: 'top' },
      h('span', { class: 'chip' }, h('span', { class: 'flame-box', html: flameSVG(streak) }), `${streak}일`),
      h('span', { class: 'chip' }, `⭐ ${state.stars}`),
      h('span', { class: 'grow' }),
      h('button', { class: 'dad-btn', onclick: openDad }, '아빠'),
    ),
    h('div', { class: 'year-box' },
      h('div', { class: 'year' }, formatYear(yearAt(count))),
      h('div', { class: 'era-name' }, `${era.name} 시대`),
    ),
    h('div', { class: 'progress', role: 'progressbar', 'aria-valuenow': count, 'aria-valuemax': TOTAL_WORDS },
      h('i', { style: `width:${(count / TOTAL_WORDS) * 100}%` })),
    h('div', { class: 'progress-label' }, `외운 단어 ${count} / ${TOTAL_WORDS}`),
    h('div', { class: 'hachi-box' },
      h('div', { html: hachiSVG({ era: era.id, count, size: 200 }) }),
      h('div', { class: 'hachi-name' }, state.hachiName || '해치'),
    ),
    note ? h('div', { class: 'note' }, note) : h('button', { class: 'btn big', onclick: () => app.go('study') }, '단어 공부'),
    h('div', { class: 'locked-row' }, soon('성문 지키기'), soon('무기고'), soon('박물관')),
  );

  // 50단어 축하 → 새 역사 카드 순서로 띄운다 (화면이 바뀌었으면 하지 않는다)
  setTimeout(async () => {
    if (!el.isConnected) return;
    for (const m of newMilestones(state)) {
      await celebrate(m, state);
      state.milestone = m;
      app.save();
    }
    await showCards(pendingCards(state, cards), state, app.save);
  }, 300);
  return el;
}
