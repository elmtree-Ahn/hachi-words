import { h, guardTaps } from '../ui.js';
import { hachiSVG, eggSVG, monsterSVG, flameSVG } from '../art.js';
import { sfx } from '../sound.js';
import { ERAS, eraIndexAt } from '../timeline.js';
import { learnedCount, streakNow, localDate } from '../progress.js';
import { study } from './study.js';

const LINES = {
  hello: '나는 해치야! 우리 같이 시간 여행 하자',
  time: '영어 단어를 하나 외울 때마다 시간이 흘러. 고조선부터 지금까지!',
  trial: '첫 단어 3개로 공부 한 판을 해 보자!',
  monster: '까먹기 몬스터가 성문으로 쳐들어와! 단어를 맞혀서 막아 줘. (성문 지키기는 곧 열려요!)',
  eras: '시대가 바뀌면 나도 변신하고 새 무기가 생겨. 유물은 박물관에 모여',
  flame: '매일 오면 불꽃이 커져!',
  name: '내 이름을 지어 줘!',
};

export function tutorial(app) {
  const { state } = app;
  const root = h('div', { class: 'screen tutorial' });
  const stage = h('div', { class: 'tut-stage' });
  const skip = h('button', { class: 'skip', onclick: () => naming() }, '건너뛰기');
  let seq = 0; // 장면이 바뀔 때마다 늘어난다. 예약해 둔 일이 옛 장면 것이면 하지 않는다
  const later = (fn, ms) => {
    const my = seq;
    setTimeout(() => { if (my === seq) fn(); }, ms);
  };
  const hachi = () => {
    const count = learnedCount(state);
    return hachiSVG({ era: ERAS[eraIndexAt(count)].id, count });
  };

  root.append(stage);
  start();
  return root;

  // 비밀번호는 여기서 묻지 않는다. 아빠가 처음 '아빠' 버튼을 누를 때 정한다 (home.js)
  function start() {
    root.append(skip);
    egg();
  }

  function scene(art, text, next) {
    seq += 1;
    stage.replaceChildren(
      h('div', { class: 'tut-art pop-in', html: art }),
      h('div', { class: 'bubble' }, text),
      h('button', { class: 'btn big', onclick: () => next() }, '다음'),
    );
    guardTaps();
  }

  function egg() {
    seq += 1;
    const art = h('button', { class: 'tut-art wobble', html: eggSVG(), 'aria-label': '알 누르기', onclick: () => hatch() });
    stage.replaceChildren(art, h('p', { class: 'prompt-sm' }, '알을 톡 눌러 봐!'));
    later(() => hatch(), 4000); // 안 눌러도 4초 뒤에 깨어난다
    function hatch() {
      if (art.disabled) return;
      art.disabled = true;
      art.classList.remove('wobble');
      art.innerHTML = eggSVG(true);
      later(() => {
        sfx('roar');
        seq += 1;
        stage.replaceChildren(h('div', { class: 'tut-art pop-in', html: hachi() }), h('div', { class: 'roar' }, '어흥~!'));
        later(() => scene(hachi(), LINES.hello, () => scene(hachi(), LINES.time, trial)), 1300);
      }, 700);
    }
  }

  function trial() {
    seq += 1;
    stage.replaceChildren(h('div', { class: 'bubble' }, LINES.trial), study(app, { size: 3, onDone: afterTrial }));
  }

  function afterTrial() {
    scene(monsterSVG(140), LINES.monster, () =>
      scene(hachi(), LINES.eras, () =>
        scene(flameSVG(Math.max(1, streakNow(state, localDate()))), LINES.flame, naming)));
  }

  function naming() {
    seq += 1;
    skip.remove();
    const input = h('input', { class: 'name-input', maxlength: '8', value: state.hachiName || '해치', 'aria-label': '해치 이름' });
    stage.replaceChildren(
      h('div', { class: 'tut-art', html: hachi() }),
      h('div', { class: 'bubble' }, LINES.name),
      input,
      h('button', { class: 'btn big', onclick: () => {
        state.hachiName = input.value.trim().slice(0, 8) || '해치';
        state.tutorialDone = true;
        app.save();
        location.replace('#home');
      } }, '좋아!'),
    );
    guardTaps();
  }
}
