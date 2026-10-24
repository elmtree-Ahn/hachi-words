// 코드로 그린 동글동글 그림. 사용자 입력을 절대 섞지 않는 고정 SVG 글자다.
const LOOKS = {
  gojoseon: { body: '#FFD98E', outfit: '#A47148', trim: '#E9C46A' }, // 짐승 가죽 옷
  samguk: { body: '#FFD98E', outfit: '#E76F51', trim: '#FFF3E0' }, // 붉은 저고리
};

// 50단어마다 받는 소품. 같은 자리(slot)는 나중 것으로 바뀐다
export const PROPS = [
  { m: 1, slot: 'head', name: '풀잎 왕관' },
  { m: 2, slot: 'neck', name: '조개 목걸이' },
  { m: 4, slot: 'head', name: '깃털 머리띠' },
];
const PROP_SVG = {
  '풀잎 왕관': '<g fill="#7BC67B" stroke="#4E9F4E" stroke-width="2">'
    + '<ellipse cx="78" cy="50" rx="6" ry="13" transform="rotate(-35 78 50)"/>'
    + '<ellipse cx="89" cy="44" rx="6" ry="13" transform="rotate(-15 89 44)"/>'
    + '<ellipse cx="111" cy="44" rx="6" ry="13" transform="rotate(15 111 44)"/>'
    + '<ellipse cx="122" cy="50" rx="6" ry="13" transform="rotate(35 122 50)"/></g>',
  '조개 목걸이': `<g fill="#FFF3E0" stroke="#D4A373" stroke-width="2">${
    [[72, 116], [83, 121], [94, 124], [106, 124], [117, 121], [128, 116]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5"/>`).join('')}</g>`,
  '깃털 머리띠': '<rect x="70" y="52" width="60" height="7" rx="3.5" fill="#2A9D8F"/>'
    + '<ellipse cx="76" cy="38" rx="6" ry="17" fill="#F4A261" transform="rotate(-18 76 38)"/>'
    + '<ellipse cx="124" cy="38" rx="6" ry="17" fill="#E9C46A" transform="rotate(18 124 38)"/>',
};

export function propsFor(count) {
  const bySlot = {};
  for (const p of PROPS) if (count >= p.m * 50) bySlot[p.slot] = p;
  return Object.values(bySlot);
}

export function hachiSVG({ era = 'gojoseon', count = 0, size = 180, mood = '' } = {}) {
  const look = LOOKS[era] || Object.values(LOOKS).at(-1); // 다음 단계에서 시대별 모습을 더 그린다
  const mane = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return `<circle cx="${(100 + 40 * Math.cos(a)).toFixed(1)}" cy="${(82 + 40 * Math.sin(a)).toFixed(1)}" r="14"/>`;
  }).join('');
  return `<svg class="hachi ${mood}" viewBox="0 0 200 200" width="${size}" height="${size}" role="img" aria-label="해치">
<ellipse cx="100" cy="135" rx="52" ry="45" fill="${look.body}"/>
<path d="M56 128 Q100 150 144 128 L146 158 Q100 182 54 158 Z" fill="${look.outfit}"/>
<path d="M54 150 Q100 170 146 150" stroke="${look.trim}" stroke-width="6" fill="none" stroke-linecap="round"/>
<ellipse cx="50" cy="138" rx="10" ry="16" fill="${look.body}"/>
<ellipse cx="150" cy="138" rx="10" ry="16" fill="${look.body}"/>
<ellipse cx="78" cy="181" rx="15" ry="9" fill="#F2C46D"/>
<ellipse cx="122" cy="181" rx="15" ry="9" fill="#F2C46D"/>
<g fill="#F4A259">${mane}</g>
<path d="M100 24 Q107 38 109 52 L91 52 Q93 38 100 24 Z" fill="#6DC5CA" stroke="#4BA3A8" stroke-width="2"/>
<circle cx="100" cy="82" r="40" fill="#FFE7B3"/>
<circle cx="86" cy="80" r="6.5" fill="#3B2F2F"/><circle cx="88.2" cy="77.8" r="2.2" fill="#fff"/>
<circle cx="114" cy="80" r="6.5" fill="#3B2F2F"/><circle cx="116.2" cy="77.8" r="2.2" fill="#fff"/>
<ellipse cx="75" cy="94" rx="7" ry="4" fill="#FF9AA2" opacity=".7"/>
<ellipse cx="125" cy="94" rx="7" ry="4" fill="#FF9AA2" opacity=".7"/>
<ellipse cx="100" cy="90" rx="4" ry="3" fill="#C9773B"/>
<path d="M93 97 Q100 103 107 97" stroke="#3B2F2F" stroke-width="3" fill="none" stroke-linecap="round"/>
${propsFor(count).map((p) => PROP_SVG[p.name]).join('')}
</svg>`;
}

export function eggSVG(cracked = false) {
  return `<svg class="egg" viewBox="0 0 200 220" width="180" height="198" role="img" aria-label="알">
<ellipse cx="100" cy="120" rx="62" ry="80" fill="#FFF3D6" stroke="#E9C46A" stroke-width="4"/>
<circle cx="75" cy="95" r="9" fill="#6DC5CA" opacity=".6"/>
<circle cx="125" cy="140" r="12" fill="#F4A259" opacity=".5"/>
<circle cx="110" cy="80" r="6" fill="#F4A259" opacity=".5"/>
${cracked ? '<path d="M42 118 L62 104 L78 122 L96 100 L114 124 L132 102 L148 120 L158 112" stroke="#B08A3E" stroke-width="4" fill="none" stroke-linejoin="round"/>' : ''}
</svg>`;
}

// 까먹기 몬스터: 무섭지 않게, 어지러운 눈
export function monsterSVG(size = 120) {
  return `<svg class="monster" viewBox="0 0 120 120" width="${size}" height="${size}" role="img" aria-label="까먹기 몬스터">
<path d="M20 100 Q10 50 40 30 Q60 15 80 30 Q110 50 100 100 Q90 92 80 100 Q70 92 60 100 Q50 92 40 100 Q30 92 20 100 Z" fill="#B39DDB"/>
<circle cx="45" cy="58" r="11" fill="#fff"/><circle cx="75" cy="58" r="11" fill="#fff"/>
<path d="M40 58 a5 5 0 1 1 5 5" stroke="#4A3F35" stroke-width="3" fill="none"/>
<path d="M70 58 a5 5 0 1 1 5 5" stroke="#4A3F35" stroke-width="3" fill="none"/>
<path d="M50 80 Q60 86 70 80" stroke="#4A3F35" stroke-width="3" fill="none" stroke-linecap="round"/>
<text x="88" y="24" font-size="22" fill="#7E57C2">?</text>
</svg>`;
}

// 세로 화면에서는 가운데(x 약 130~270)만 보이므로 움집을 줄여서 그 안에 둔다
const HUT = `<g transform="translate(101 86) scale(.6)"><polygon points="40,215 90,135 140,215" fill="#C9A26B"/>
<path d="M60 185 L120 185 M52 200 L128 200 M70 170 L110 170" stroke="#A47148" stroke-width="3"/>
<path d="M80 215 Q90 192 100 215 Z" fill="#6B4F34"/></g>
<g transform="translate(69 86) scale(.6)"><polygon points="270,220 310,160 350,220" fill="#D4B483"/>
<path d="M285 200 L335 200" stroke="#A47148" stroke-width="3"/>
<path d="M302 220 Q310 202 318 220 Z" fill="#6B4F34"/></g>`;
const CHOGA = `<g><rect x="50" y="175" width="110" height="45" fill="#F1E3C8" stroke="#C9A26B" stroke-width="2"/>
<path d="M38 180 Q105 120 172 180 Z" fill="#D4A373"/>
<rect x="95" y="190" width="22" height="30" fill="#8D6E4F"/>
<rect x="62" y="188" width="20" height="16" fill="#FFF8E7" stroke="#C9A26B"/></g>
<g stroke="#A47148" stroke-width="3"><path d="M240 225 V200 M260 225 V200 M280 225 V200 M300 225 V200 M320 225 V200 M230 210 H330"/></g>`;

// 시대 배경: 고조선 = 움집, 그 뒤 = 초가집 (다음 단계에서 더 그린다)
export function sceneSVG(era) {
  return `<svg class="scene" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CDEFF2"/><stop offset="1" stop-color="#F7ECDF"/></linearGradient></defs>
<rect width="400" height="300" fill="url(#sky)"/>
<circle cx="330" cy="60" r="28" fill="#FFE08A"/>
<path d="M0 210 Q100 180 200 205 T400 200 V300 H0 Z" fill="#CFE8B0"/>
${era === 'gojoseon' ? HUT : CHOGA}
</svg>`;
}

export function flameSVG(streak) {
  const k = Math.min(1 + streak * 0.08, 1.8);
  const lit = streak > 0;
  return `<svg class="flame" viewBox="0 0 40 50" width="${Math.round(28 * k)}" height="${Math.round(35 * k)}" aria-hidden="true">
<path d="M20 2 Q34 18 32 32 Q30 46 20 48 Q10 46 8 32 Q6 20 20 2 Z" fill="${lit ? '#FF8A3D' : '#D9D2C5'}"/>
${lit ? '<path d="M20 20 Q27 30 25 38 Q22 44 20 44 Q16 44 15 38 Q14 30 20 20 Z" fill="#FFD166"/>' : ''}
</svg>`;
}
