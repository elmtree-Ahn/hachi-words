import { h, guardTaps } from '../ui.js';
import { hachiSVG } from '../art.js';
import { playWord, playSentence, sfx } from '../sound.js';
import { ERAS, yearAt, eraIndexAt, formatYear } from '../timeline.js';
import { learnedCount, canStudy, nextSet, localDate, markLearned, addWrong, finishSet, pendingCards } from '../progress.js';
import { createSession, nextQuestion, answer, checkSpell, matchQuestion, finishMatch, summary } from '../session.js';
import { showCards } from '../popups.js';

// 단어 공부 한 판: 만나기 → 섞인 문제 → 짝 찾기 → 끝
export function study(app, opts = {}) {
  const { state, words, cards } = app;
  const root = h('div', { class: 'screen study' });
  const set = nextSet(state, words, opts.size || 5);
  const leave = () => (opts.onDone ? opts.onDone() : app.back());

  if (!set.length || (!opts.onDone && !canStudy(state, localDate()))) {
    root.append(
      h('p', { class: 'bubble' }, set.length ? '오늘은 여기까지! 내일 또 만나' : '다음 단어는 곧 와요!'),
      h('button', { class: 'btn big', onclick: leave }, opts.onDone ? '다음' : '돌아가기'),
    );
    return root;
  }

  const s = createSession(set);
  const yearStart = yearAt(learnedCount(state));
  const yearEl = h('span', { class: 'year-tick' }, formatYear(yearStart));
  const leftEl = h('span', { class: 'left' });
  const body = h('div', { class: 'study-body' });
  root.append(
    h('header', { class: 'study-top' },
      opts.onDone ? h('span', { class: 'x-btn' }) : h('button', { class: 'x-btn', onclick: leave, 'aria-label': '그만하기' }, '✕'),
      h('span', { class: 'grow' }, yearEl),
      leftEl,
    ),
    body,
  );
  meet(0);
  return root;

  function show(...nodes) {
    body.replaceChildren(...nodes);
    guardTaps();
  }
  function soundBtn(play, size = '') { return h('button', { class: `sound ${size}`, onclick: play, 'aria-label': '듣기' }, '🔊'); }
  function float(text) {
    const f = h('div', { class: 'float' }, text);
    document.body.append(f);
    setTimeout(() => f.remove(), 900);
  }

  function meet(i) {
    const w = set[i];
    playWord(w.id);
    show(
      h('div', { class: 'card' },
        h('div', { class: 'meet-count' }, `새 단어 ${i + 1} / ${set.length}`),
        h('div', { class: 'big-word' }, w.word),
        soundBtn(() => playWord(w.id)),
        h('div', { class: 'ko' }, w.ko),
        h('div', { class: 'ex' }, w.ex, ' ', soundBtn(() => playSentence(w.id), 'sm')),
        h('div', { class: 'ex-ko' }, w.exKo),
      ),
      h('button', { class: 'btn big', onclick: () => (i + 1 < set.length ? meet(i + 1) : ask()) }, i + 1 < set.length ? '다음' : '연습 시작!'),
    );
  }

  function ask() {
    if (!root.isConnected) return; // 화면을 떠났으면 예약된 다음 문제도 멈춘다
    const q = nextQuestion(s, words);
    // 지금 문제까지 센다 ('알겠어'를 두 번 눌러 같은 문제가 다시 와도 숫자가 그대로)
    leftEl.textContent = `남은 문제 ${s.queue.length + (s.current ? 1 : 0) + (s.matchDone ? 0 : 1)}`;
    if (q) return q.mode === 'spell' ? spell(q) : choose(q);
    const m = matchQuestion(s);
    if (m) return match(m);
    return end();
  }

  // 외운 순간 바로 저장하고 연도를 올린다 (중간에 나가도 남는다)
  function learn(id) {
    if (!markLearned(state, id, localDate())) return;
    app.save();
    yearEl.textContent = formatYear(yearAt(learnedCount(state)));
    yearEl.classList.add('bump');
    setTimeout(() => yearEl.classList.remove('bump'), 300);
    float('외웠다! ✨');
  }

  function finish(ok, q) {
    const { learnedNow, failed } = answer(s, ok);
    if (learnedNow) learn(q.word.id);
    if (failed) {
      addWrong(state, q.word.id);
      app.save();
    }
    if (ok) {
      sfx('ok');
      if (!q.retry && !learnedNow) float('+1 ⭐');
      setTimeout(ask, 800);
      return;
    }
    sfx('no');
    playWord(q.word.id);
    body.append(h('div', { class: 'reveal' },
      h('div', {}, h('b', {}, q.word.word), ` = ${q.word.ko}`),
      h('button', { class: 'btn', onclick: ask }, '알겠어'),
    ));
  }

  function choose(q) {
    const w = q.word;
    const en = q.mode !== 'meaning';
    let prompt;
    if (q.mode === 'meaning') {
      prompt = [h('div', { class: 'big-word' }, w.word), soundBtn(() => playWord(w.id))];
      playWord(w.id);
    } else if (q.mode === 'word') {
      prompt = [h('p', { class: 'prompt-sm' }, '영어로 뭘까?'), h('div', { class: 'big-ko' }, w.ko)];
    } else if (q.mode === 'listen') {
      prompt = [h('p', { class: 'prompt-sm' }, '잘 듣고 골라요'), soundBtn(() => playWord(w.id), 'big')];
      playWord(w.id);
    } else {
      prompt = [h('p', { class: 'prompt-sm' }, '빈칸에 들어갈 단어는?'), h('div', { class: 'sentence' }, q.sentence), h('div', { class: 'ex-ko' }, w.exKo)];
    }
    const buttons = q.choices.map((c) => h('button', { class: en ? 'choice en' : 'choice', onclick: () => pickIt(c) }, en ? c.word : c.ko));
    function pickIt(c) {
      buttons.forEach((b) => { b.disabled = true; });
      const ok = c.id === w.id;
      buttons[q.choices.indexOf(c)].classList.add(ok ? 'right' : 'wrong');
      buttons[q.choices.indexOf(w)].classList.add('right');
      finish(ok, q);
    }
    show(h('div', { class: 'prompt' }, prompt), h('div', { class: 'choices' }, buttons));
  }

  function spell(q) {
    const picked = [];
    const slots = q.letters.map((ch, i) => (q.blanks.includes(i)
      ? h('span', { class: 'slot empty' })
      : h('span', { class: ch === ' ' ? 'slot space' : 'slot' }, ch === ' ' ? ' ' : ch)));
    const holes = q.blanks.map((i) => slots[i]);
    const paint = () => holes.forEach((el, i) => {
      el.textContent = picked[i]?.t || '';
      el.classList.toggle('empty', !picked[i]);
    });
    const undo = h('button', { class: 'btn ghost', onclick: () => {
      const p = picked.pop();
      if (p) { p.b.disabled = false; paint(); }
    } }, '지우기');
    const tiles = q.tiles.map((t) => {
      const b = h('button', { class: 'tile', onclick: () => {
        if (picked.length === holes.length) return;
        picked.push({ t, b });
        b.disabled = true;
        paint();
        if (picked.length < holes.length) return;
        tiles.forEach((x) => { x.disabled = true; });
        undo.disabled = true;
        const ok = checkSpell(q, picked.map((p) => p.t));
        holes.forEach((el, i) => {
          el.textContent = q.letters[q.blanks[i]];
          el.classList.add(ok ? 'right' : 'wrong');
        });
        finish(ok, q);
      } }, t);
      return b;
    });
    playWord(q.word.id);
    show(
      h('div', { class: 'prompt' }, h('p', { class: 'prompt-sm' }, '글자 조각을 맞춰요'), h('div', { class: 'big-ko' }, q.word.ko), soundBtn(() => playWord(q.word.id))),
      h('div', { class: 'slots' }, slots),
      h('div', { class: 'tiles' }, tiles),
      undo,
    );
  }

  function match(m) {
    leftEl.textContent = '마지막!';
    let chosen = null;
    let mistakes = 0;
    let remaining = m.words.length;
    const missed = new Set();
    const wordBtns = new Map();
    const left = m.words.map((w) => {
      const b = h('button', { class: 'choice en', onclick: () => {
        wordBtns.forEach((x) => x.classList.remove('picked'));
        b.classList.add('picked');
        chosen = w;
        playWord(w.id);
      } }, w.word);
      wordBtns.set(w.id, b);
      return b;
    });
    const right = m.meanings.map((w) => {
      const b = h('button', { class: 'choice', onclick: () => {
        if (!chosen) return;
        if (chosen.id !== w.id) {
          sfx('no');
          mistakes += 1;
          missed.add(chosen.id);
          b.classList.add('shake');
          setTimeout(() => b.classList.remove('shake'), 300);
          return;
        }
        sfx('pop');
        for (const x of [b, wordBtns.get(w.id)]) {
          x.disabled = true;
          x.classList.add('gone');
        }
        chosen = null;
        remaining -= 1;
        if (remaining > 0) return;
        const clean = m.words.filter((x) => !missed.has(x.id)).map((x) => x.id);
        finishMatch(s, clean, mistakes).forEach(learn);
        setTimeout(ask, 600);
      } }, w.ko);
      return b;
    });
    show(h('p', { class: 'prompt-sm' }, '단어와 뜻의 짝을 찾아요!'), h('div', { class: 'match' }, h('div', {}, left), h('div', {}, right)));
  }

  function end() {
    const sum = summary(s);
    const stars = finishSet(state, localDate(), sum);
    app.save();
    const count = learnedCount(state);
    const again = !opts.onDone && canStudy(state, localDate()) && nextSet(state, words).length > 0;
    leftEl.textContent = '';
    show(h('div', { class: 'end' },
      h('div', { html: hachiSVG({ era: ERAS[eraIndexAt(count)].id, count, size: 150 }) }),
      h('h2', {}, sum.perfect ? '완벽해!' : sum.learned.length ? '잘했어!' : '괜찮아, 또 해 보자!'),
      h('p', {}, `외운 단어 ${sum.learned.length}개 · 별 +${stars}`),
      h('p', { class: 'year-move' }, `${formatYear(yearStart)} → ${formatYear(yearAt(count))}`),
      opts.onDone ? h('button', { class: 'btn big', onclick: opts.onDone }, '다음') : null,
      again ? h('button', { class: 'btn big', onclick: () => root.replaceWith(study(app)) }, '한 판 더?') : null,
      opts.onDone ? null : h('button', { class: 'btn ghost', onclick: () => app.back() }, '홈으로'),
    ));
    showCards(pendingCards(state, cards), state, app.save);
  }
}
