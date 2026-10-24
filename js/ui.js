// 작은 DOM 도우미
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v; // art.js 의 고정 SVG만 넣는다 (사용자 입력 금지)
    else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
  }
  el.append(...children.flat().filter((c) => c != null && c !== false));
  return el;
}

// 화면 위에 뜨는 창. build(close)가 내용을 만들고, close(값)을 부르면 닫히며 그 값을 돌려준다
export function modal(build) {
  return new Promise((resolve) => {
    const back = h('div', { class: 'modal-back' });
    const close = (value) => {
      back.remove();
      resolve(value);
    };
    back.append(h('div', { class: 'modal' }, build(close)));
    document.body.append(back);
    guardTaps();
  });
}

export function toast(text) {
  const t = h('div', { class: 'toast' }, text);
  document.body.append(t);
  setTimeout(() => t.remove(), 1800);
}

// 화면이 바뀐 직후 0.3초 동안은 누름을 무시한다 (빠르게 두 번 눌러 다음 카드까지 넘어가지 않게)
export function guardTaps(ms = 300) {
  const until = Date.now() + ms;
  const block = (e) => {
    if (Date.now() < until) {
      e.stopPropagation();
      e.preventDefault();
    }
  };
  document.addEventListener('click', block, true);
  setTimeout(() => document.removeEventListener('click', block, true), ms);
}
