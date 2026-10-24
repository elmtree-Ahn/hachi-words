import { h, modal, toast } from './ui.js';
import { hachiSVG, PROPS } from './art.js';
import { sfx } from './sound.js';
import { ERAS, eraIndexAt } from './timeline.js';

// 숫자 4자리 입력판. 4자리를 다 누르면 그 숫자를, 취소하면 null을 돌려준다
export function pinPad(title, { cancel = true } = {}) {
  return modal((close) => {
    let pin = '';
    let done = false;
    const dots = h('div', { class: 'pin-dots' });
    const paint = () => { dots.textContent = '●'.repeat(pin.length) + '○'.repeat(4 - pin.length); };
    const press = (k) => {
      if (done) return;
      if (k === '⌫') pin = pin.slice(0, -1);
      else if (pin.length < 4) pin += k;
      paint();
      if (pin.length === 4) {
        done = true;
        const value = pin;
        setTimeout(() => close(value), 150);
      }
    };
    paint();
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k) =>
      (k ? h('button', { class: 'key', onclick: () => press(k) }, k) : h('span')));
    return [
      h('h2', {}, title),
      dots,
      h('div', { class: 'keypad' }, keys),
      cancel ? h('button', { class: 'btn ghost', onclick: () => close(null) }, '취소') : null,
    ];
  });
}

export async function setPin(state, save) {
  for (;;) {
    const first = await pinPad('부모님 비밀번호 4자리를 정해 주세요', { cancel: false });
    const again = await pinPad('한 번 더 눌러 주세요', { cancel: false });
    if (first === again) {
      state.pin = first;
      save();
      return;
    }
    toast('두 번이 달라요. 다시 해 주세요');
  }
}

export function historyCard(card) {
  sfx('pop');
  return modal((close) => [
    h('div', { class: 'card-year' }, card.label),
    card.myth ? h('div', { class: 'badge' }, '이렇게 전해져요') : null,
    h('p', { class: 'card-text' }, card.text),
    h('button', { class: 'btn', onclick: () => close() }, '알겠어!'),
  ]);
}

// 카드를 하나씩 보여 주고, 본 카드는 바로 저장한다
export async function showCards(cards, state, save) {
  for (const card of cards) {
    await historyCard(card);
    state.seenCards.push(card.id);
    save();
  }
}

// 50단어 축하: 시대가 바뀌면 큰 변신, 아니면 새 소품
export function celebrate(m, state) {
  const count = m * 50;
  const era = ERAS[eraIndexAt(count)];
  const changed = eraIndexAt(count) !== eraIndexAt(count - 1);
  const prop = PROPS.find((p) => p.m === m);
  const name = state.hachiName || '해치';
  sfx('ok');
  return modal((close) => [
    h('h2', {}, changed ? `${era.name} 시대에 왔어!` : prop ? `새 소품: ${prop.name}` : `단어 ${count}개 돌파!`),
    h('div', { html: hachiSVG({ era: era.id, count, size: 160 }) }),
    h('p', { class: 'card-text' }, changed ? `${name}, ${era.name} 시대 모습으로 변신!` : `단어를 ${count}개나 외웠어!`),
    h('button', { class: 'btn', onclick: () => close() }, '와!'),
  ]);
}
