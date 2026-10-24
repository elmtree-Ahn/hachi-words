import words from '../data/words.js';
import cards from '../data/history.js';
import * as store from './store.js';
import { h } from './ui.js';
import { localDate } from './progress.js';
import { home } from './screens/home.js';
import { study } from './screens/study.js';
import { tutorial } from './screens/tutorial.js';
import { dad } from './screens/dad.js';

const SCREENS = { home, study, tutorial, dad };
const root = document.getElementById('app');

const app = {
  state: null,
  words,
  cards,
  save: () => store.save(app.state),
  go: (name) => { location.hash = name; },
  back: () => history.back(),
  render() {
    document.querySelectorAll('.modal-back').forEach((m) => m.remove()); // 뒤로 버튼으로 떠난 창 정리
    const screen = SCREENS[location.hash.slice(1)] || home;
    app.day = localDate();
    root.replaceChildren(screen(app));
    window.scrollTo(0, 0);
  },
};

window.addEventListener('hashchange', () => app.render());

// 밤새 켜 둔 앱이 다음 날 다시 보이면 홈을 새로 그린다 (하루 최대·불꽃을 새 날짜로). 공부 중인 판은 건드리지 않는다
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && app.day !== localDate() && (SCREENS[location.hash.slice(1)] || home) === home) app.render();
});

// 인터넷 주소(https)에서 열었을 때만: 파일을 아이패드에 담아 두고(비행기 모드용), 기록을 지우지 말라고 부탁한다
if (location.protocol === 'https:' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
  navigator.storage?.persist?.();
}

try {
  app.state = await store.load();
  // 앱을 켤 때는 늘 처음 화면에서 시작한다 (예전 주소에 머물지 않게)
  const start = app.state.tutorialDone ? '#home' : '#tutorial';
  if (location.hash === start) app.render();
  else location.replace(start);
} catch (err) {
  root.replaceChildren(h('div', { class: 'screen' }, h('h2', {}, '앗, 문제가 생겼어요'), h('pre', {}, String(err?.stack || err))));
}
