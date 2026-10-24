import { h, toast } from '../ui.js';
import { ERAS, TOTAL_WORDS, yearAt, eraIndexAt, formatYear } from '../timeline.js';
import { learnedCount, streakNow, localDate, parseBackup } from '../progress.js';

export function dad(app) {
  const { state, words } = app;
  const today = localDate();
  const count = learnedCount(state);
  const byId = new Map(words.map((w) => [w.id, w]));
  const wrong = Object.entries(state.wrong)
    .map(([id, n]) => ({ w: byId.get(Number(id)), n }))
    .filter((x) => x.w)
    .sort((a, b) => b.n - a.n)
    .slice(0, 20);
  const maxEl = h('b', {}, `${state.dailyMax}개`);
  const setMax = (d) => {
    state.dailyMax = Math.min(100, Math.max(5, state.dailyMax + d));
    maxEl.textContent = `${state.dailyMax}개`;
    app.save();
  };
  const row = (k, v) => h('div', { class: 'row' }, h('span', {}, k), h('b', {}, v));
  const section = (title, ...kids) => h('section', {}, h('h3', {}, title), ...kids);

  // 백업: 기록 전체를 파일 하나로. 아이패드에서는 공유 창(파일에 저장·메일)으로 보낸다
  async function makeBackup() {
    const name = `hachi-backup-${localDate()}.json`;
    const file = new File([JSON.stringify(state)], name, { type: 'application/json' });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
      } catch {
        // 공유 창을 닫으면 그냥 넘어간다
      }
      return;
    }
    const a = h('a', { href: URL.createObjectURL(file), download: name });
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  const picker = h('input', { type: 'file', accept: '.json,application/json', hidden: true, onchange: async () => {
    const f = picker.files[0];
    picker.value = '';
    if (!f) return;
    const next = parseBackup(await f.text());
    if (!next) {
      toast('백업 파일이 아니에요');
      return;
    }
    if (!confirm(`지금 기록을 이 백업(외운 단어 ${learnedCount(next)}개)으로 바꿀까요?`)) return;
    app.state = next;
    await app.save();
    toast('불러왔어요');
    app.render();
  } });

  return h('div', { class: 'screen dad' },
    h('header', { class: 'dad-top' },
      h('button', { class: 'btn ghost', onclick: () => app.back() }, '← 홈'),
      h('h2', {}, '아빠 화면'),
    ),
    section('진행 상황',
      row('외운 단어', `${count} / ${TOTAL_WORDS}`),
      row('앱에 들어 있는 단어', `${words.length}개`),
      row('지금 연도', `${formatYear(yearAt(count))} (${ERAS[eraIndexAt(count)].name})`),
      row('출석 불꽃', `지금 ${streakNow(state, today)}일 · 최고 ${state.streak.best}일`),
      row('오늘 외운 단어', `${state.today.date === today ? state.today.learned : 0}개`),
      row('별', `${state.stars}개`),
      // 서비스 워커가 이 화면을 맡고 있으면 파일이 모두 담긴 것 (설치가 끝나야 맡는다)
      row('마지막 저장', state.savedAt ? new Date(state.savedAt).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '아직 없음'),
      row('비행기 모드', navigator.serviceWorker?.controller ? '준비됨 ✓' : '아직 — 와이파이에서 홈 화면 앱으로 한 번 열어 주세요'),
    ),
    section('하루 최대 단어 수',
      h('div', { class: 'stepper' },
        h('button', { class: 'key', onclick: () => setMax(-5), 'aria-label': '5개 줄이기' }, '−'),
        maxEl,
        h('button', { class: 'key', onclick: () => setMax(5), 'aria-label': '5개 늘리기' }, '+'),
      ),
    ),
    section('자주 틀리는 단어',
      ...(wrong.length ? wrong.map(({ w, n }) => row(`${w.word} · ${w.ko}`, `${n}번`)) : [h('p', {}, '아직 없어요')]),
    ),
    section('튜토리얼',
      h('button', { class: 'btn', onclick: () => location.replace('#tutorial') }, '튜토리얼 다시 보기'),
    ),
    section('백업',
      h('p', {}, '기록은 이 아이패드 안에만 있어요. 홈 화면의 앱을 지우면 기록도 사라지니, 가끔 백업 파일을 만들어 \'파일\' 앱이나 메일에 보관해 주세요.'),
      h('div', { class: 'backup-row' },
        h('button', { class: 'btn', onclick: makeBackup }, '백업 만들기'),
        h('button', { class: 'btn', onclick: () => picker.click() }, '불러오기'),
      ),
      picker,
    ),
  );
}
