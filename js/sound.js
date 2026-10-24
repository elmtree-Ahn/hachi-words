// 단어·예문 소리(앱 안 파일)와 짧은 효과음(WebAudio로 즉석에서 만듦)
let player = null;
const pad = (n) => String(n).padStart(4, '0');

// 아이패드 사파리는 처음 누를 때 허락된 소리 객체를 다시 써야 계속 소리가 난다
function play(src) {
  player ||= new Audio();
  player.pause();
  player.src = src;
  player.play().catch(() => {}); // 소리가 안 나도 공부는 계속한다
}
export const playWord = (id) => play(`audio/w/${pad(id)}.m4a`);
export const playSentence = (id) => play(`audio/s/${pad(id)}.m4a`);

// [시작 높이(Hz), 시작 시각(초), 길이(초), 끝 높이(Hz, 없으면 그대로)]
const TONES = {
  ok: [[660, 0, 0.1], [880, 0.1, 0.18]],
  no: [[240, 0, 0.25, 180]],
  pop: [[900, 0, 0.08, 1400]],
  roar: [[260, 0, 0.5, 110], [200, 0.35, 0.6, 90]],
};
let ctx = null;

export function sfx(name) {
  try {
    ctx ||= new AudioContext();
    if (ctx.state === 'suspended') ctx.resume(); // 사파리는 누르기 전에 만든 소리판을 잠가 둔다
    for (const [freq, at, dur, end] of TONES[name]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime + at;
      osc.type = name === 'roar' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t);
      if (end) osc.frequency.exponentialRampToValueAtTime(end, t + dur);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur);
    }
  } catch {
    // 효과음 없이 진행
  }
}
