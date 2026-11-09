(() => {
'use strict';
const IC = {"volume-2":"<path d=\"M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z\"/> <path d=\"M16 9a5 5 0 0 1 0 6\"/> <path d=\"M19.364 18.364a9 9 0 0 0 0-12.728\"/>","languages":"<path d=\"m5 8 6 6\"/> <path d=\"m4 14 6-6 2-3\"/> <path d=\"M2 5h12\"/> <path d=\"M7 2h1\"/> <path d=\"m22 22-5-10-5 10\"/> <path d=\"M14 18h6\"/>","scan-text":"<path d=\"M3 7V5a2 2 0 0 1 2-2h2\"/> <path d=\"M17 3h2a2 2 0 0 1 2 2v2\"/> <path d=\"M21 17v2a2 2 0 0 1-2 2h-2\"/> <path d=\"M7 21H5a2 2 0 0 1-2-2v-2\"/> <path d=\"M7 8h8\"/> <path d=\"M7 12h10\"/> <path d=\"M7 16h6\"/>","keyboard":"<path d=\"M10 8h.01\"/> <path d=\"M12 12h.01\"/> <path d=\"M14 8h.01\"/> <path d=\"M16 12h.01\"/> <path d=\"M18 8h.01\"/> <path d=\"M6 8h.01\"/> <path d=\"M7 16h10\"/> <path d=\"M8 12h.01\"/> <rect width=\"20\" height=\"16\" x=\"2\" y=\"4\" rx=\"2\"/>","mic":"<path d=\"M12 19v3\"/> <path d=\"M19 10v2a7 7 0 0 1-14 0v-2\"/> <rect x=\"9\" y=\"2\" width=\"6\" height=\"13\" rx=\"3\"/>","audio-lines":"<path d=\"M2 10v3\"/> <path d=\"M6 6v11\"/> <path d=\"M10 3v18\"/> <path d=\"M14 8v7\"/> <path d=\"M18 5v13\"/> <path d=\"M22 10v3\"/>","spell-check":"<path d=\"m20 15-5.5 5.5L12 18\"/> <path d=\"m4 16 6-12 5.115 10.23\"/> <path d=\"M6 12h8\"/>","download":"<path d=\"M12 15V3\"/> <path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\"/> <path d=\"m7 10 5 5 5-5\"/>","copy":"<rect width=\"14\" height=\"14\" x=\"8\" y=\"8\" rx=\"2\" ry=\"2\"/> <path d=\"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2\"/>","play":"<path d=\"M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z\"/>","pause":"<rect x=\"14\" y=\"3\" width=\"5\" height=\"18\" rx=\"1\"/> <rect x=\"5\" y=\"3\" width=\"5\" height=\"18\" rx=\"1\"/>","check":"<path d=\"M20 6 9 17l-5-5\"/>","star":"<path d=\"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z\"/>","file-audio":"<path d=\"M4 6.835V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2h-.343\"/> <path d=\"M14 2v5a1 1 0 0 0 1 1h5\"/> <path d=\"M2 19a2 2 0 0 1 4 0v1a2 2 0 0 1-4 0v-4a6 6 0 0 1 12 0v4a2 2 0 0 1-4 0v-1a2 2 0 0 1 4 0\"/>","users":"<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"/> <path d=\"M16 3.128a4 4 0 0 1 0 7.744\"/> <path d=\"M22 21v-2a4 4 0 0 0-3-3.87\"/> <circle cx=\"9\" cy=\"7\" r=\"4\"/>","lock":"<rect width=\"18\" height=\"11\" x=\"3\" y=\"11\" rx=\"2\" ry=\"2\"/> <path d=\"M7 11V7a5 5 0 0 1 10 0v4\"/>","monitor":"<rect width=\"20\" height=\"14\" x=\"2\" y=\"3\" rx=\"2\"/> <line x1=\"8\" x2=\"16\" y1=\"21\" y2=\"21\"/> <line x1=\"12\" x2=\"12\" y1=\"17\" y2=\"21\"/>","video":"<path d=\"m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5\"/> <rect x=\"2\" y=\"6\" width=\"14\" height=\"12\" rx=\"2\"/>","hard-drive":"<path d=\"M10 16h.01\"/> <path d=\"M2.212 11.577a2 2 0 0 0-.212.896V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5.527a2 2 0 0 0-.212-.896L18.55 5.11A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z\"/> <path d=\"M21.946 12.013H2.054\"/> <path d=\"M6 16h.01\"/>","globe":"<circle cx=\"12\" cy=\"12\" r=\"10\"/> <path d=\"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20\"/> <path d=\"M2 12h20\"/>","monitor-speaker":"<path d=\"M5.5 20H8\"/> <path d=\"M17 9h.01\"/> <rect width=\"10\" height=\"16\" x=\"12\" y=\"4\" rx=\"2\"/> <path d=\"M8 6H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4\"/> <circle cx=\"17\" cy=\"15\" r=\"1\"/>","text-cursor":"<path d=\"M17 22h-1a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4h1\"/> <path d=\"M7 22h1a4 4 0 0 0 4-4\"/> <path d=\"M7 2h1a4 4 0 0 1 4 4\"/>","x":"<path d=\"M18 6 6 18\"/> <path d=\"m6 6 12 12\"/>","chevron-right":"<path d=\"m9 18 6-6-6-6\"/>","rotate-ccw":"<path d=\"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8\"/> <path d=\"M3 3v5h5\"/>","cpu":"<path d=\"M12 20v2\"/> <path d=\"M12 2v2\"/> <path d=\"M17 20v2\"/> <path d=\"M17 2v2\"/> <path d=\"M2 12h2\"/> <path d=\"M2 17h2\"/> <path d=\"M2 7h2\"/> <path d=\"M20 12h2\"/> <path d=\"M20 17h2\"/> <path d=\"M20 7h2\"/> <path d=\"M7 20v2\"/> <path d=\"M7 2v2\"/> <rect x=\"4\" y=\"4\" width=\"16\" height=\"16\" rx=\"2\"/> <rect x=\"8\" y=\"8\" width=\"8\" height=\"8\" rx=\"1\"/>","external-link":"<path d=\"M15 3h6v6\"/> <path d=\"M10 14 21 3\"/> <path d=\"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6\"/>","pencil-line":"<path d=\"M13 21h8\"/> <path d=\"m15 5 4 4\"/> <path d=\"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z\"/>","circle-check":"<circle cx=\"12\" cy=\"12\" r=\"10\"/> <path d=\"m16 9-5.5 5.5L8 12\"/>","skip-back":"<path d=\"M17.971 4.285A2 2 0 0 1 21 6v12a2 2 0 0 1-3.029 1.715l-9.997-5.998a2 2 0 0 1-.003-3.432z\"/> <path d=\"M3 20V4\"/>","skip-forward":"<path d=\"M21 4v16\"/> <path d=\"M6.029 4.285A2 2 0 0 0 3 6v12a2 2 0 0 0 3.029 1.715l9.997-5.998a2 2 0 0 0 .003-3.432z\"/>","square":"<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\"/>","pin":"<path d=\"M12 17v5\"/> <path d=\"M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z\"/>","arrow-left-right":"<path d=\"M8 3 4 7l4 4\"/> <path d=\"M4 7h16\"/> <path d=\"m16 21 4-4-4-4\"/> <path d=\"M20 17H4\"/>","chevron-down":"<path d=\"m6 9 6 6 6-6\"/>","shield-check":"<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\"/> <path d=\"m9 12 2 2 4-4\"/>","wifi-off":"<path d=\"M12 20h.01\"/> <path d=\"M8.5 16.429a5 5 0 0 1 7 0\"/> <path d=\"M5 12.859a10 10 0 0 1 5.17-2.69\"/> <path d=\"M19 12.859a10 10 0 0 0-2.007-1.523\"/> <path d=\"M2 8.82a15 15 0 0 1 4.177-2.643\"/> <path d=\"M22 8.82a15 15 0 0 0-11.288-3.764\"/> <path d=\"m2 2 20 20\"/>","message-square":"<path d=\"M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z\"/>","send-horizontal":"<path d=\"M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z\"/> <path d=\"M6 12h16\"/>","loader":"<path d=\"M12 2v4\"/> <path d=\"m16.2 7.8 2.9-2.9\"/> <path d=\"M18 12h4\"/> <path d=\"m16.2 16.2 2.9 2.9\"/> <path d=\"M12 18v4\"/> <path d=\"m4.9 19.1 2.9-2.9\"/> <path d=\"M2 12h4\"/> <path d=\"m4.9 4.9 2.9 2.9\"/>"};
const ico = (n) => `<svg class="lu" viewBox="0 0 24 24" aria-hidden="true">${IC[n] || ''}</svg>`;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || '');
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- The page's language: the English page sets nothing; a translated one sets window.TYTS before this script ---------- */
const PAGE = window.TYTS || {};
const merge = (base, over) => { const out = { ...base }; Object.keys(over || {}).forEach((k) => { out[k] = over[k] && typeof over[k] === 'object' && !Array.isArray(over[k]) ? merge(base[k], over[k]) : over[k]; }); return out; };
// The page's own words. Tyts's windows drawn on the page (the cards, the talk's lines) stay in English, as in Tyts.
const T = merge({
  closed: '<b>Card closed, voice stopped.</b> Select a sentence and press {mod}+C twice to open it again.',
  freeNote: 'Tyts would translate this on your computer. This page carries translations of the duck story only.',
  pressKey: 'press a key…',
  yourKey: 'your key',
  eg: 'e.g.',
  keyAria: 'Your key to {act}: {k}. Click to set it again',
  setAria: 'Set your key to {act}',
  takenListen: '{k} is taken by reading aloud.',
  taken: '{k} is taken: it would {act}.',
  setTranslate: 'Set. Select a line on this page and press {k}.',
  setTalk: 'Set. Press {k} to say your line to the duck, and again to send it.',
  setOther: 'Set. In Tyts, {k} would {act}.',
  selectFirst: 'Select a line first, then press your key.',
  wouldNow: 'In Tyts, {k} would now {act}.',
  selectSentence: 'select a sentence first',
  onceMore: 'once more',
  fixed: 'fixed',
  acts: { menu: "open Tyts's menu", translate: 'translate the selected text', inplace: 'translate the selected text in place', check: 'check your English', dictate: 'start dictating', english: 'dictate and type English', note: 'dictate a note', meeting: 'record a call', talk: 'talk to the duck' },
  levels: { fast: 'About 85 MB for a language pair, quick on any processor.', accurate: '5.2 GB, 0.7 s a sentence on an RTX 2080 SUPER. Recommended for most computers.', most: '7 GB, the best wording. For graphics cards from about 12 GB.' },
  tkLevels: {
    A2: ['A2 · Elementary', 'short sentences of everyday words, simple tenses, no idioms. About 7 words a sentence.'],
    B1: ['B1 · Intermediate', 'everyday words and common phrasal verbs; a rarer word explained. About 8.5 words a sentence.'],
    B2: ['B2 · Upper-intermediate', 'natural speech, phrasal verbs, an idiom now and then. About 15 words a sentence.']
  },
  tk: {
    button: 'the button', listening: 'Listening · press', toSend: 'to send', thinking: 'The duck is thinking…', speaking: 'The duck is speaking · press', toAnswer: 'to answer',
    done: 'That is the scene. Try another topic or level.', press: 'Press', toSay: 'to say your line', said: 'Three lines said.', again: 'Start again', last: 'The last line is said.',
    drops: 'drops the line', yourLine: 'Your line', send: 'Send the line', restart: 'Start the talk again', stop: 'Stop the duck and say your line', say: 'Say your line'
  }
}, PAGE.text);
const t = (s, v = {}) => s.replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m));
// The examples in the version's language: the English and Ukrainian pages type Ukrainian, the Russian page Russian.
const DEMO = merge({
  typed: 'ghbdsn cdsn',
  fixed: 'привіт світ',
  kb: [
    { wrong: 'ghbdsn', fix: 'привіт', from: 'EN', to: 'UK' },
    { text: ' як справи, глянь ' },
    { wrong: 'згдд', fix: 'pull', from: 'UK', to: 'EN' },
    { text: ' request' }
  ],
  quack: 'uk'
}, PAGE.demo);
// The language links take the place on the page along.
$$('.langs a').forEach((a) => a.addEventListener('click', () => { a.href = a.getAttribute('href').split('#')[0] + location.hash; }));

/* ---------- Voice: the browser's own, an English one that runs locally when there is one ---------- */
const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
// In the talk your lines are read by a woman's voice and the duck's by a man's, told apart by the voices' names.
const HER = /\b(aria|jenny|zira|ava|emma|libby|sonia|hazel|susan|samantha|michelle|female)\b/i;
const HIM = /\b(guy|david|mark|andrew|brian|christopher|eric|ryan|george|male)\b/i;
function pickVoice(lang, who) {
  if (!synth) return null;
  let vs = [];
  try { vs = synth.getVoices() || []; } catch (e) { vs = []; }
  const mine = vs.filter((v) => (v.lang || '').toLowerCase().startsWith(lang));
  const best = (list) => list.find((v) => v.localService && /natural|neural|aria|jenny|guy/i.test(v.name))
    || list.find((v) => v.localService) || list[0] || null;
  const kind = who === 'her' ? HER : who === 'him' ? HIM : null;
  return (kind && best(mine.filter((v) => kind.test(v.name)))) || best(mine);
}
// A browser with one voice: the two still sound apart by pitch.
function pitchOf(v, who) {
  if (!who || (v && (who === 'her' ? HER : HIM).test(v.name))) return 1;
  return who === 'her' ? 1.25 : 0.8;
}
if (synth && synth.addEventListener) synth.addEventListener('voiceschanged', () => {});
let speakId = 0;
// The talk's state, set once its part of the page runs: the voice tells it when another reading takes over.
var tkState = null;
function wordStarts(text) { const out = []; text.replace(/[\p{L}\p{N}'’]+/gu, (m, o) => { out.push(o); return m; }); return out; }
function simulate(text, onword, id, withEnd, onend) {
  const starts = wordStarts(text);
  let i = 0;
  const tick = () => {
    if (id !== speakId) return;
    if (i < starts.length) { onword && onword(starts[i]); i++; setTimeout(tick, 290); }
    else if (withEnd) onend && onend();
  };
  tick();
}
function speak(text, opts = {}) {
  const { onword, onend, lang = 'en', who } = opts;
  const id = ++speakId;
  talkVoice(id);
  const done = () => { if (id === speakId) onend && onend(); };
  if (!synth) { simulate(text, onword, id, true, done); return; }
  try { synth.cancel(); } catch (e) {}
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice(lang, who);
  if (v) { u.voice = v; u.lang = v.lang; } else u.lang = ({ uk: 'uk-UA', ru: 'ru-RU' })[lang] || 'en-US';
  u.rate = 0.95; u.pitch = pitchOf(v, who);
  let heard = false;
  u.onboundary = (e) => { if (id !== speakId) return; if (!e.name || e.name === 'word') { heard = true; onword && onword(e.charIndex); } };
  u.onend = done;
  u.onerror = done;
  setTimeout(() => {
    if (id !== speakId) return;
    try { synth.speak(u); } catch (e) { simulate(text, onword, id, true, done); return; }
    setTimeout(() => { if (!heard && id === speakId) simulate(text, onword, id, false); }, 500);
  }, 40);
}
function quietCard() { if (typeof quietCards === 'function') quietCards(); }
function hush() { speakId++; talkVoice(speakId); if (synth) { try { synth.cancel(); } catch (e) {} } }

/* ---------- Header ---------- */
const nav = $('#nav');
const onScroll = () => nav.classList.toggle('scrolled', scrollY > 8);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- The stage: the chain line, Tyts's opening moment ---------- */
const TYPED = DEMO.typed;
const FIXED = DEMO.fixed;
const main = $('#lineMain');
const sub = $('#lineSub');
const steps = $$('#steps .step');
let stageRun = 0;
function stepState(n) {
  steps.forEach((s, i) => {
    s.classList.toggle('wait', n > 0 && i + 1 > n);
    $$('.key', s).forEach((k) => k.classList.toggle('lit', i + 1 === n));
  });
}
function pressKeys(n) {
  const ks = $$('.key', steps[n - 1]);
  ks.forEach((k) => k.classList.add('press'));
  setTimeout(() => ks.forEach((k) => k.classList.remove('press')), 140);
}
function englishLine() {
  main.innerHTML = '<span class="w">hello</span> <span class="w">world</span><span class="wave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span><span class="caret"></span>';
}
async function playStage(sound) {
  const run = ++stageRun;
  const alive = () => run === stageRun;
  stepState(1); $$('.key', steps[0]).forEach((k) => k.classList.remove('lit'));
  steps[0].classList.remove('wait');
  sub.classList.add('off');
  main.classList.add('typing');
  main.innerHTML = '<span class="caret"></span>';
  const caret = $('.caret', main);
  const chars = [];
  await sleep(300);
  for (const c of TYPED) {
    if (!alive()) return;
    const s = document.createElement('span');
    s.className = 'ch'; s.textContent = c;
    main.insertBefore(s, caret); chars.push(s);
    await sleep(70 + Math.random() * 70);
  }
  await sleep(450); if (!alive()) return;
  stepState(1); pressKeys(1);
  chars.forEach((s, i) => setTimeout(() => {
    if (!alive()) return;
    s.classList.add('flip');
    setTimeout(() => { s.textContent = FIXED[i]; }, 150);
    setTimeout(() => s.classList.remove('flip'), 320);
  }, i * 55));
  await sleep(55 * TYPED.length + 900); if (!alive()) return;
  stepState(2); pressKeys(2); setTimeout(() => pressKeys(2), 180);
  main.classList.add('leave');
  await sleep(240); if (!alive()) return;
  main.classList.remove('typing');
  englishLine();
  sub.textContent = FIXED;
  main.classList.remove('leave');
  sub.classList.remove('off');
  await sleep(900); if (!alive()) return;
  stepState(3); pressKeys(3); setTimeout(() => pressKeys(3), 180);
  const words = $$('.w', main);
  const wave = $('.wave', main);
  wave.classList.add('on');
  const mark = (charIndex) => { const i = charIndex >= 6 ? 1 : 0; words.forEach((w, j) => { w.classList.toggle('now', j === i); if (j < i) w.classList.add('read'); }); };
  await new Promise((resolve) => {
    let ended = false;
    const finish = () => { if (!ended) { ended = true; resolve(); } };
    if (sound) {
      speak('hello world', { onword: mark, onend: finish });
      setTimeout(finish, 4000);
    } else {
      mark(0); setTimeout(() => mark(6), 520); setTimeout(finish, 1200);
    }
  });
  if (!alive()) return;
  words.forEach((w) => { w.classList.remove('now'); w.classList.add('read'); });
  await sleep(500); if (!alive()) return;
  wave.classList.remove('on');
  stepState(0);
  setTimeout(() => { if (alive()) words.forEach((w) => w.classList.remove('read')); }, 1600);
}
// The chain plays again and again while the stage is on screen, silent, resting on its last frame between runs;
// Replay plays it at once with sound, and the loop goes on silent after it.
let stageOn = false;
let stageGen = 0;
const STAGE_REST = 3800;
function stageLoop(soundFirst) {
  const g = ++stageGen;
  stageOn = true;
  (async () => {
    let sound = soundFirst;
    while (stageOn && g === stageGen) {
      await playStage(sound);
      sound = false;
      if (!stageOn || g !== stageGen) break;
      await sleep(STAGE_REST);
    }
  })();
}
$('#replay').addEventListener('click', () => { quietCard(); if (reduce) playStage(true); else stageLoop(true); });
if (!reduce) {
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting && !stageOn) stageLoop(false);
      else if (!e.isIntersecting) stageOn = false;
    }), { threshold: 0.35 }).observe($('#stage'));
  } else playStage(false);
}

/* ---------- The duck story and Tyts's card ---------- */
const STORY = [
  'Every morning, an old duck crossed the street to the bakery.',
  'Nobody knew where it lived, but the baker always kept a warm crust for it.',
  'One day the duck brought a friend, and the queue grew a little longer.'
];
const LANGS = { uk: 'Ukrainian', de: 'German', es: 'Spanish', fr: 'French', it: 'Italian', pl: 'Polish', ru: 'Russian' };
const TR = {
  uk: ['Щоранку стара качка переходила вулицю до пекарні.', 'Ніхто не знав, де вона живе, але пекар завжди залишав для неї теплу скоринку.', 'Одного дня качка привела подругу, і черга стала трохи довшою.'],
  de: ['Jeden Morgen überquerte eine alte Ente die Straße zur Bäckerei.', 'Niemand wusste, wo sie wohnte, aber der Bäcker hob immer eine warme Kruste für sie auf.', 'Eines Tages brachte die Ente eine Freundin mit, und die Schlange wurde ein wenig länger.'],
  es: ['Cada mañana, un viejo pato cruzaba la calle hasta la panadería.', 'Nadie sabía dónde vivía, pero el panadero siempre le guardaba una corteza caliente.', 'Un día el pato trajo a un amigo, y la cola se hizo un poco más larga.'],
  pl: ['Każdego ranka stara kaczka przechodziła przez ulicę do piekarni.', 'Nikt nie wiedział, gdzie mieszka, ale piekarz zawsze zostawiał dla niej ciepłą skórkę.', 'Pewnego dnia kaczka przyprowadziła koleżankę i kolejka zrobiła się trochę dłuższa.'],
  fr: ['Chaque matin, un vieux canard traversait la rue jusqu’à la boulangerie.', 'Personne ne savait où il vivait, mais le boulanger lui gardait toujours une croûte chaude.', 'Un jour, le canard amena un ami, et la file d’attente s’allongea un peu.'],
  it: ['Ogni mattina, una vecchia anatra attraversava la strada fino alla panetteria.', 'Nessuno sapeva dove vivesse, ma il fornaio teneva sempre da parte una crosta calda per lei.', 'Un giorno l’anatra portò un’amica, e la fila si allungò un po’.'],
  ru: ['Каждое утро старая утка переходила улицу к пекарне.', 'Никто не знал, где она живёт, но пекарь всегда оставлял для неё тёплую корочку.', 'Однажды утка привела подругу, и очередь стала немного длиннее.']
};
const DICT = {
  bakery: { ipa: '/ˈbeɪkəri/', senses: [['noun', { uk: 'пекарня, булочна', de: 'Bäckerei', es: 'panadería', fr: 'boulangerie', it: 'panetteria, forno', pl: 'piekarnia', ru: 'пекарня, булочная' }]] },
  crust: { ipa: '/krʌst/', senses: [['noun', { uk: 'скоринка, кірка', de: 'Kruste, Rinde', es: 'corteza', fr: 'croûte', it: 'crosta', pl: 'skórka', ru: 'корочка, корка' }]] },
  queue: { ipa: '/kjuː/', senses: [['noun', { uk: 'черга', de: 'Schlange, Warteschlange', es: 'cola, fila', fr: 'file d’attente', it: 'fila, coda', pl: 'kolejka', ru: 'очередь' }], ['verb', { uk: 'стояти в черзі', de: 'anstehen', es: 'hacer cola', fr: 'faire la queue', it: 'fare la fila', pl: 'stać w kolejce', ru: 'стоять в очереди' }]] }
};
const NOTES = {
  uk: 'have sent → sent: зі словом yesterday потрібен Past Simple, а не Present Perfect.',
  de: 'have sent → sent: Mit „yesterday“ steht das Past Simple, nicht das Present Perfect.',
  es: 'have sent → sent: con «yesterday» se usa el Past Simple, no el Present Perfect.',
  pl: 'have sent → sent: przy „yesterday” używa się Past Simple, a nie Present Perfect.',
  fr: 'have sent → sent : avec « yesterday », on emploie le Past Simple, pas le Present Perfect.',
  it: 'have sent → sent: con «yesterday» si usa il Past Simple, non il Present Perfect.',
  ru: 'have sent → sent: со словом yesterday нужен Past Simple, а не Present Perfect.'
};
// The card's language: a translated page's own; on the English page the browser's, else Ukrainian; a pick in the card wins.
let lang = TR[PAGE.lang] ? PAGE.lang : 'uk';
try {
  const pref = (navigator.languages || [navigator.language || '']).map((l) => (l || '').slice(0, 2).toLowerCase()).find((l) => TR[l]);
  if (pref && !TR[PAGE.lang]) lang = pref;
  const saved = localStorage.getItem('tyts-lang');
  if (saved && TR[saved]) lang = saved;
} catch (e) {}

// Words as spans with their offsets, so the voice's word boundaries can mark them.
function tokens(text, dict, live) {
  let html = '';
  let last = 0;
  text.replace(/[A-Za-z’']+/g, (m, o) => {
    html += esc(text.slice(last, o));
    const k = m.toLowerCase().replace(/[’']s$/, '');
    const rare = dict && DICT[k];
    html += `<span class="w${rare ? ' rare' : ''}" data-o="${o}"${rare ? ` data-w="${k}"` + (live ? ' tabindex="0" role="button"' : '') : ''}>${esc(m)}</span>`;
    last = o + m.length;
    return m;
  });
  return html + esc(text.slice(last));
}

const story = $('#story');
story.innerHTML = STORY.map((s, i) => `<span class="s" data-i="${i}">${tokens(s, true)}</span>`).join(' ');
const slot = $('#cardSlot');
const floatLayer = $('#floatLayer');
const MOD = isMac ? '⌘' : 'Ctrl';
$('#modKey').textContent = MOD;
const mkCard = (host, float) => ({ host, float, kind: 'Listen', mode: 'story', idx: [0, 1], en: [], cursor: 0, playing: false, one: false, lower: true, via: [MOD, 'C', '×2'], el: null });
const bandCard = mkCard(slot, false);
const floatCard = mkCard(floatLayer, true);
const card = bandCard; // the band's card, for code that only knows one
const cardOf = (node) => (floatCard.el && floatCard.el.contains(node) ? floatCard : bandCard.el && bandCard.el.contains(node) ? bandCard : null);
function capsHtml(parts, lit) { return parts.map((p) => p === '×2' ? '<span class="x2">×2</span>' : `<kbd class="key${lit ? ' lit' : ''}">${esc(p)}</kbd>`).join(''); }

function renderCard(c, pop) {
  const tr = c.mode === 'story' ? c.idx.map((i) => TR[lang][i]) : null;
  const el = document.createElement('div');
  el.className = 'kcard' + (pop ? ' pop' : '');
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', 'Tyts card: ' + c.kind);
  const listen = c.kind === 'Listen';
  el.innerHTML = `
    <div class="kc-head">
      <span class="keys">${c.via ? capsHtml(c.via, true) : ''}</span>
      <span class="kc-title">${c.kind === 'Listen' ? 'Read aloud' : c.kind}</span>
      <span class="kc-tools">
        <button class="kc-lang" type="button" aria-pressed="${c.lower}" title="Show or hide the translation">${lang.toUpperCase()}</button>
        <button class="kc-icon" type="button" data-act="close" aria-label="Close the card">${ico('x')}</button>
      </span>
    </div>
    <div class="kc-en" data-words>${c.en.map((s, i) => `<span class="s" data-i="${i}">${tokens(s, c.mode === 'story', true)}</span>`).join(' ')}</div>
    <div class="kc-bar">
      <button class="kc-btn" type="button" data-act="copy-en">${ico('copy')}<span>Copy</span></button>
      <span class="remote">
        ${listen ? `<button class="kc-icon" type="button" data-act="prev" aria-label="Previous sentence">${ico('skip-back')}</button>` : ''}
        <button class="kc-btn" type="button" data-act="play">${c.playing ? ico('square') + '<span>Stop</span>' : ico('play') + '<span>Listen</span>'}</button>
        ${listen ? `<button class="kc-icon" type="button" data-act="next" aria-label="Next sentence">${ico('skip-forward')}</button>
        <button class="chip" type="button" data-act="one" aria-pressed="${c.one}">One by one</button>` : ''}
      </span>
    </div>
    <div class="kc-lower"${c.lower ? '' : ' hidden'}>
      <div class="kc-tr">${tr ? tr.map((s, i) => `<span class="t" data-i="${i}">${esc(s)}</span>`).join(' ') : `<span class="free">${T.freeNote}</span>`}</div>
      <div class="kc-bar"><button class="kc-btn" type="button" data-act="copy-tr">${ico('copy')}<span>Copy</span></button></div>
    </div>
    <div class="kc-foot">
      <span>${tr ? 'Translated · Fast' : 'English · read aloud'}</span>
      <label>Your language <select class="langSel" aria-label="Your language">${Object.entries(LANGS).map(([k, v]) => `<option value="${k}"${k === lang ? ' selected' : ''}>${v}</option>`).join('')}</select></label>
    </div>`;
  if (c.float) {
    if (c.el) c.el.remove();
    floatLayer.appendChild(el);
    if (c.at) { el.style.left = c.at.left + 'px'; el.style.top = c.at.top + 'px'; }
  } else {
    slot.innerHTML = '';
    slot.appendChild(el);
    $$('#story .s').forEach((s) => s.classList.toggle('picked', c.mode === 'story' && c.idx.includes(+s.dataset.i)));
  }
  c.el = el;
  markReading(c);
}
function markReading(c, wordOffset) {
  if (!c.el) return;
  $$('.kc-en .s', c.el).forEach((s) => {
    const on = c.playing && +s.dataset.i === c.cursor;
    s.classList.toggle('reading', on);
    $$('.w', s).forEach((w) => w.classList.remove('now'));
    if (on && wordOffset != null) {
      let pick = null;
      $$('.w', s).forEach((w) => { if (+w.dataset.o <= wordOffset) pick = w; });
      if (pick) pick.classList.add('now');
    }
  });
  const play = $('[data-act="play"]', c.el);
  if (play) play.innerHTML = c.playing ? ico('square') + '<span>Stop</span>' : ico('play') + '<span>Listen</span>';
}
function quietCards() { [bandCard, floatCard].forEach((c) => { if (c.playing) { c.playing = false; markReading(c); } }); }
function readFrom(c, i) {
  if (!c.en.length) return;
  quietCards();
  c.cursor = Math.max(0, Math.min(c.en.length - 1, i));
  c.playing = true;
  markReading(c, 0);
  const at = c.cursor;
  speak(c.en[at], {
    onword: (o) => { if (c.playing && c.cursor === at) markReading(c, o); },
    onend: () => {
      if (!c.playing || c.cursor !== at) return;
      if (c.one) { c.playing = false; c.cursor = at + 1 < c.en.length ? at + 1 : 0; markReading(c); return; }
      if (at + 1 < c.en.length) readFrom(c, at + 1);
      else { c.playing = false; c.cursor = 0; markReading(c); }
    }
  });
}
function stopReading(c) { c.playing = false; hush(); markReading(c); }
function closeWordCard(c) { const wc = c.el && $('.wordcard', c.el); if (wc) wc.remove(); }
function openWord(c, w) {
  closeWordCard(c);
  const k = w.dataset.w; const d = DICT[k];
  if (!d) return;
  const wc = document.createElement('div');
  wc.className = 'wordcard';
  wc.innerHTML = `<div class="wc-top"><b>${k}</b><span class="wc-ipa">${d.ipa}</span><span class="wc-tools"><button class="kc-icon" type="button" data-act="say" aria-label="Say the word">${ico('volume-2')}</button><button class="kc-icon star" type="button" data-act="star" aria-pressed="false" aria-label="Keep the word">${ico('star')}</button></span></div>${d.senses.map(([pos, m]) => `<div class="wc-m"><i>${pos}</i>${esc(m[lang])}</div>`).join('')}`;
  c.el.appendChild(wc);
  const cr = c.el.getBoundingClientRect(); const r = w.getBoundingClientRect();
  wc.style.left = Math.max(8, Math.min(r.left - cr.left - 12, cr.width - wc.offsetWidth - 8)) + 'px';
  wc.style.top = (r.bottom - cr.top + 8) + 'px';
  wc.dataset.word = k;
}
async function copyText(text, btn) {
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; } catch (e) { ok = false; }
  const label = $('span', btn);
  if (label) { const was = label.textContent; label.textContent = ok ? 'Copied' : 'Select and copy'; setTimeout(() => { label.textContent = was; }, 1200); }
}
function onCardClick(e) {
  const t = e.target;
  const c = cardOf(t); if (!c) return;
  const act = t.closest('[data-act]');
  const a = act && act.dataset.act;
  if (a === 'close') { closeCard(c); return; }
  if (a === 'copy-en') { copyText(c.en.join(' '), act); return; }
  if (a === 'copy-tr') { copyText(c.mode === 'story' ? c.idx.map((i) => TR[lang][i]).join(' ') : '', act); return; }
  if (a === 'play') { if (c.playing) stopReading(c); else readFrom(c, c.cursor); return; }
  if (a === 'prev' || a === 'next') { const n = c.cursor + (a === 'next' ? 1 : -1); if (c.playing) readFrom(c, n); else { c.cursor = Math.max(0, Math.min(c.en.length - 1, n)); } return; }
  if (a === 'one') { c.one = !c.one; act.setAttribute('aria-pressed', c.one); return; }
  if (a === 'say') { const wc = act.closest('.wordcard'); if (wc) { quietCards(); speak(wc.dataset.word); } return; }
  if (a === 'star') { const on = act.getAttribute('aria-pressed') !== 'true'; act.setAttribute('aria-pressed', on); act.setAttribute('aria-label', on ? 'Remove from your words' : 'Keep the word'); return; }
  if (t.closest('.kc-lang')) { c.lower = !c.lower; t.closest('.kc-lang').setAttribute('aria-pressed', c.lower); $('.kc-lower', c.el).hidden = !c.lower; return; }
  const rare = t.closest('.kc-en .rare');
  if (rare) { openWord(c, rare); return; }
  if (!t.closest('.wordcard')) closeWordCard(c);
  const s = t.closest('.kc-en .s');
  if (s && c.mode === 'story') {
    const i = +s.dataset.i;
    const was = s.classList.contains('pair');
    $$('.pair', c.el).forEach((p) => p.classList.remove('pair'));
    if (!was) { s.classList.add('pair'); const tt = $(`.kc-tr .t[data-i="${i}"]`, c.el); if (tt) tt.classList.add('pair'); }
  }
}
slot.addEventListener('click', onCardClick);
floatLayer.addEventListener('click', onCardClick);
document.addEventListener('keydown', (e) => {
  const rare = e.target.closest && e.target.closest('.kc-en .rare');
  const c = rare && cardOf(rare);
  if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openWord(c, rare); }
});
document.addEventListener('change', (e) => {
  if (!e.target.classList || !e.target.classList.contains('langSel')) return;
  lang = e.target.value;
  try { localStorage.setItem('tyts-lang', lang); } catch (err) {}
  [bandCard, floatCard].forEach((c) => { if (c.el) { const was = c.playing; c.playing = false; renderCard(c, false); if (was) readFrom(c, c.cursor); } });
  hush();
  setCheck(checkMode);
  tkNotes();
});
function closeCard(c) {
  stopReading(c);
  if (c.float) { if (c.el) c.el.remove(); c.el = null; return; }
  c.el = null;
  $$('#story .s').forEach((s) => s.classList.remove('picked'));
  slot.innerHTML = `<div class="closed-note">${t(T.closed, { mod: MOD })}</div>`;
}
// A text in the band opens the band's card; any other text, a card by the selection, as Tyts opens it by the pointer.
function openCard(mode, data, opts = {}) {
  hush(); quietCards();
  const c = opts.rect ? floatCard : bandCard;
  c.kind = opts.kind || 'Listen';
  c.via = opts.via || [MOD, 'C', '×2'];
  c.mode = mode;
  if (mode === 'story') { c.idx = data; c.en = data.map((i) => STORY[i]); }
  else { c.idx = []; c.en = (data.match(/[^.!?]+[.!?]*["”’)]*\s*/g) || [data]).map((s) => s.trim()).filter(Boolean).slice(0, 6); }
  c.cursor = 0; c.playing = false; c.lower = true;
  if (c.float) {
    const cw = document.documentElement.clientWidth; const w = Math.min(460, cw - 32);
    c.at = { left: Math.max(16, Math.min(opts.rect.left + scrollX, cw - w - 16)), top: opts.rect.bottom + scrollY + 10 };
  }
  renderCard(c, true);
  if (c.kind === 'Listen') readFrom(c, 0);
  if (c.float) {
    const r = c.el.getBoundingClientRect();
    if (r.bottom > innerHeight) scrollBy({ top: r.bottom - innerHeight + 24, behavior: reduce ? 'auto' : 'smooth' });
  } else {
    const r = slot.getBoundingClientRect();
    if (r.top < 64 || r.bottom > innerHeight) slot.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: r.height > innerHeight - 80 ? 'start' : 'center' });
  }
}
// A click elsewhere hides the card by the selection, as Tyts's card hides when it is not pinned.
addEventListener('pointerdown', (e) => { if (floatCard.el && !floatCard.el.contains(e.target)) closeCard(floatCard); }, { capture: true });

/* ---------- Keys the visitor sets: a dashed cap records the next key pressed ---------- */
const toastEl = $('#toast');
let toastT = 0;
function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), 2600); }
const MODS = { Control: 'Ctrl', Shift: 'Shift', Alt: 'Alt', Meta: isMac ? '⌘' : 'Win' };
const ACT_NAME = T.acts;
const keysSet = {};
let recording = null; let tapMod = null; let tapAt = 0;
const same = (a, b) => !!a && !!b && a.join('+') === b.join('+');
function keyFrom(e) {
  if (e.repeat) return null;
  if (MODS[e.key]) {
    const now = performance.now();
    if (tapMod === e.key && now - tapAt <= 400) { tapMod = null; return [MODS[e.key], '×2']; }
    tapMod = e.key; tapAt = now; return null;
  }
  tapMod = null;
  const name = e.key === 'Pause' ? 'Pause' : /^F\d{1,2}$/.test(e.key) ? e.key : (e.code || '').startsWith('Key') ? e.code.slice(3) : (e.code || '').startsWith('Digit') ? e.code.slice(5) : e.key.length === 1 ? e.key.toUpperCase() : e.key;
  const mods = [e.ctrlKey && 'Ctrl', e.altKey && 'Alt', e.shiftKey && 'Shift', e.metaKey && (isMac ? '⌘' : 'Win')].filter(Boolean);
  if (!mods.length && !/^(Pause|F\d{1,2}|Insert|ScrollLock)$/.test(name)) return null;
  if (mods.length === 1 && mods[0] === 'Shift' && name.length === 1) return null;
  return [...mods, name];
}
function renderKeys() {
  $$('button.rec').forEach((b) => {
    const k = keysSet[b.dataset.act];
    const listening = recording === b.dataset.act;
    b.classList.toggle('listening', listening);
    b.classList.toggle('set', !!k && !listening);
    b.classList.toggle('key', !k || listening);
    b.classList.toggle('mine', !k || listening);
    b.innerHTML = listening ? T.pressKey : k ? capsHtml(k) : T.yourKey;
    b.setAttribute('aria-label', k ? t(T.keyAria, { act: ACT_NAME[b.dataset.act], k: k.join(' ') }) : t(T.setAria, { act: ACT_NAME[b.dataset.act] }));
  });
  $$('.kslot[data-act="translate"]').forEach((s) => {
    const k = keysSet.translate; const lit = !!s.dataset.lit;
    s.innerHTML = k ? capsHtml(k, lit) : (lit ? '' : `<span class="eg">${T.eg}</span>`) + capsHtml(['Shift', '×2'], lit);
  });
  if (tkState) tkDraw();
}
function setKey(act, parts) {
  if (same(parts, [MOD, 'C', '×2']) || same(parts, [MOD, 'C'])) { toast(t(T.takenListen, { k: parts.join(' ') })); return; }
  const other = Object.keys(keysSet).find((a) => a !== act && same(keysSet[a], parts));
  if (other) { toast(t(T.taken, { k: parts.join(' '), act: ACT_NAME[other] })); return; }
  keysSet[act] = parts; recording = null; renderKeys();
  toast(t(act === 'translate' ? T.setTranslate : act === 'talk' ? T.setTalk : T.setOther, { k: parts.join(' '), act: ACT_NAME[act] }));
}
document.addEventListener('click', (e) => {
  const b = e.target.closest && e.target.closest('button.rec'); if (!b) return;
  recording = recording === b.dataset.act ? null : b.dataset.act; tapMod = null; renderKeys();
});

// Ctrl+C twice: two copies 40–650 ms apart, as Tyts counts them.
const more = $('#more');
const hintKeys = $$('#hintKeys .key');
let lastCopy = 0;
function flashKeys() { hintKeys.forEach((k) => { k.classList.add('lit', 'press'); }); setTimeout(() => hintKeys.forEach((k) => k.classList.remove('press')), 120); setTimeout(() => hintKeys.forEach((k) => k.classList.remove('lit')), 700); }
function hint(msg) { more.textContent = msg; more.classList.add('on'); clearTimeout(more._t); more._t = setTimeout(() => more.classList.remove('on'), 1400); }
function fromSelection(opts = {}) {
  const sel = getSelection();
  const text = sel ? sel.toString().replace(/\s+/g, ' ').trim() : '';
  if (!text || !sel.rangeCount) { if (opts.kind === 'Translate') toast(T.selectFirst); else hint(T.selectSentence); return; }
  const range = sel.getRangeAt(0);
  if (cardOf(range.commonAncestorContainer)) return;
  const idx = $$('#story .s').filter((s) => range.intersectsNode(s)).map((s) => +s.dataset.i);
  const inBand = $('#try').contains(range.commonAncestorContainer);
  if (idx.length) { openCard('story', idx, opts); return; }
  const rects = range.getClientRects(); const rect = rects.length ? rects[rects.length - 1] : range.getBoundingClientRect();
  openCard('free', text.slice(0, 600), inBand ? opts : { ...opts, rect });
}
const inField = (t) => t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
document.addEventListener('keydown', (e) => {
  if (recording) {
    if (e.key === 'Escape') { recording = null; renderKeys(); return; }
    if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); delete keysSet[recording]; recording = null; renderKeys(); return; }
    const k = keyFrom(e); if (k) { e.preventDefault(); setKey(recording, k); }
    return;
  }
  if (e.key === 'Escape') {
    if (tkCancel()) return;
    const c = floatCard.el ? floatCard : bandCard.el ? bandCard : null;
    if (c) { if ($('.wordcard', c.el)) { closeWordCard(c); return; } closeCard(c); }
    return;
  }
  const k = inField(e.target) ? null : keyFrom(e);
  if (k) {
    if (same(k, keysSet.translate)) { e.preventDefault(); fromSelection({ kind: 'Translate', via: k }); return; }
    if (same(k, keysSet.talk)) { e.preventDefault(); tkKey(); return; }
    const act = Object.keys(keysSet).find((a) => same(keysSet[a], k));
    if (act) { e.preventDefault(); toast(t(T.wouldNow, { k: k.join(' '), act: ACT_NAME[act] })); return; }
  }
  const isC = e.code === 'KeyC' || (e.key || '').toLowerCase() === 'c';
  if (!isC || !(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey || e.repeat) return;
  const now = performance.now();
  flashKeys();
  if (lastCopy && now - lastCopy >= 40 && now - lastCopy <= 650) { lastCopy = 0; more.classList.remove('on'); fromSelection(); }
  else { lastCopy = now; hint(T.onceMore); }
});
document.addEventListener('keyup', (e) => { if (!MODS[e.key] && tapMod) tapMod = null; });
$('#tapTry').addEventListener('click', async () => {
  const s = $('#story .s[data-i="2"]');
  try { const r = document.createRange(); r.selectNodeContents(s); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); } catch (e) {}
  flashKeys(); await sleep(220); flashKeys(); await sleep(160);
  openCard('story', [2]);
});
bandCard.en = bandCard.idx.map((i) => STORY[i]);
renderCard(bandCard, false);
renderKeys();

/* ---------- Keyboard mock: two words fixed as they are typed ---------- */
const kmField = $('#kmField');
const kmLog = $('#kmLog');
const badge = $('#lbadge');
const KB = DEMO.kb;
let kbRun = 0;
async function playKb() {
  const run = ++kbRun; const alive = () => run === kbRun;
  kmField.innerHTML = '<span class="lbadge" id="lbadge">EN</span><span class="caret"></span>';
  const b = $('.lbadge', kmField); const caret = $('.caret', kmField);
  kmLog.innerHTML = '';
  placeAt(b, caret);
  for (const t of KB) {
    if (!alive()) return;
    if (t.text) {
      for (const c of t.text) { if (!alive()) return; caret.before(document.createTextNode(c)); placeAt(b, caret); await sleep(55 + Math.random() * 45); }
    } else {
      const w = document.createElement('span'); caret.before(w);
      const chars = [];
      for (const c of t.wrong) { if (!alive()) return; const s = document.createElement('span'); s.className = 'ch'; s.textContent = c; w.appendChild(s); chars.push(s); placeAt(b, caret); await sleep(80 + Math.random() * 50); }
      await sleep(320); if (!alive()) return;
      chars.forEach((s, i) => setTimeout(() => { s.classList.add('flip'); setTimeout(() => { s.textContent = t.fix[i]; }, 150); setTimeout(() => s.classList.remove('flip'), 320); }, i * 45));
      await sleep(45 * chars.length + 340); if (!alive()) return;
      w.className = 'fx';
      b.textContent = t.to; b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
      const li = document.createElement('li');
      li.innerHTML = `<span class="tag">${T.fixed}</span><span>${t.wrong} → <span class="to">${t.fix}</span></span><span>${t.from} → ${t.to}</span>`;
      kmLog.appendChild(li);
      await sleep(380);
    }
  }
}
// The badge sits just after the caret, as Tyts's does; at the right edge it drops under the caret.
function placeAt(b, c) {
  const lh = c.offsetHeight || 24;
  const right = c.offsetLeft + 10;
  const room = right + b.offsetWidth + 8 <= kmField.clientWidth;
  b.style.left = (room ? right : Math.max(8, c.offsetLeft - b.offsetWidth / 2)) + 'px';
  b.style.top = (room ? c.offsetTop + (lh - b.offsetHeight) / 2 : c.offsetTop + lh + 4) + 'px';
}
placeAt(badge, $('.caret', kmField));
addEventListener('resize', () => { const b = $('.lbadge', kmField); const c = $('.caret', kmField); if (b && c) placeAt(b, c); });

/* ---------- Translate mock: the three levels ---------- */
const LEVELS = {
  fast: ['Fast', T.levels.fast, '(Firefox Translations)'],
  accurate: ['Accurate', T.levels.accurate, '(Gemma 4 E4B)'],
  most: ['Most accurate', T.levels.most, '(Gemma 4 12B)']
};
function setLevel(l) {
  $$('#levels button').forEach((b) => b.setAttribute('aria-checked', b.dataset.l === l));
  $('#levelNote').innerHTML = `<b>${LEVELS[l][0]}.</b> ${LEVELS[l][1]} ${LEVELS[l][2]}`;
  $('#tcFoot').textContent = 'Translated · ' + LEVELS[l][0];
}
$('#levels').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setLevel(b.dataset.l); });
setLevel('accurate');

/* ---------- Check mock ---------- */
let checkMode = 'wrong';
function setCheck(m) {
  checkMode = m;
  $$('#checks button').forEach((b) => b.setAttribute('aria-checked', b.dataset.c === m));
  const note = $('#ccNote');
  if (m === 'wrong') {
    $('#ccField').textContent = 'Yesterday I have sent the report, but nobody answer me.';
    $('#ccOut').innerHTML = 'Yesterday I <del>have</del> sent the report, but nobody <del>answer</del> <ins>answered</ins> me.';
    note.textContent = NOTES[lang]; note.classList.remove('ok');
  } else {
    $('#ccField').textContent = 'I sent the report yesterday, but nobody has answered yet.';
    $('#ccOut').textContent = 'I sent the report yesterday, but nobody has answered yet.';
    note.textContent = '✓ Looks right'; note.classList.add('ok');
  }
  $('#ccLang').textContent = 'Note in ' + LANGS[lang];
}
$('#checks').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setCheck(b.dataset.c); });
setCheck('wrong');

/* ---------- Dictation badge: the phrase as it is heard, the time, a wave of the last seconds ---------- */
const PHRASE = "Let's move the release to Friday and keep the old installer for now.";
const dbText = $('#dbText');
const dbTime = $('#dbTime');
const canvas = $('#dbWave');
const ctx = canvas.getContext('2d');
const levels = new Array(60).fill(0.08);
let talking = false;
let waveOn = false;
function sizeCanvas() {
  const dpr = Math.min(2, devicePixelRatio || 1);
  const r = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(r.width * dpr));
  canvas.height = Math.max(1, Math.round(r.height * dpr));
}
function markColor() { return getComputedStyle(document.documentElement).getPropertyValue('--mark').trim() || '#ff5a36'; }
let color = markColor();
const repaint = () => { color = markColor(); drawWave(); };
try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', repaint); } catch (e) {}
new MutationObserver(repaint).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
function drawWave() {
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const n = levels.length; const step = w / n; const bw = Math.max(1.5, step * 0.5);
  ctx.fillStyle = color; ctx.globalAlpha = 0.75;
  for (let i = 0; i < n; i++) {
    const v = levels[i]; const bh = Math.max(bw, v * h);
    const x = i * step + (step - bw) / 2; const y = (h - bh) / 2;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, bw, bh, bw / 2); else ctx.rect(x, y, bw, bh);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
let lastPush = 0;
function frame(t) {
  if (!waveOn) return;
  if (t - lastPush > 50) {
    lastPush = t;
    const base = talking ? 0.25 + Math.random() * 0.65 * (0.6 + 0.4 * Math.sin(t / 180)) : 0.06 + Math.random() * 0.04;
    levels.shift(); levels.push(Math.min(1, base));
    drawWave();
  }
  requestAnimationFrame(frame);
}
function seedWave() { for (let i = 0; i < levels.length; i++) levels[i] = i > 12 ? 0.2 + Math.abs(Math.sin(i * 1.7)) * 0.6 : 0.08; }
sizeCanvas(); seedWave(); drawWave();
addEventListener('resize', () => { sizeCanvas(); drawWave(); });
let dbRun = 0;
async function playDictation() {
  const run = ++dbRun; const alive = () => run === dbRun;
  const words = PHRASE.split(' ');
  dbText.innerHTML = '';
  const t0 = performance.now();
  const clock = setInterval(() => { if (!alive()) { clearInterval(clock); return; } const s = Math.floor((performance.now() - t0) / 1000); dbTime.textContent = `0:${String(s).padStart(2, '0')}`; }, 250);
  talking = true;
  await sleep(500);
  for (let i = 0; i < words.length; i++) {
    if (!alive()) { clearInterval(clock); return; }
    const sp = document.createElement('span'); sp.className = 'new'; sp.textContent = (i ? ' ' : '') + words[i];
    dbText.appendChild(sp);
    await sleep(220 + Math.random() * 160);
  }
  talking = false;
  await sleep(1600);
  clearInterval(clock);
}

/* ---------- Mocks play while they are on screen ---------- */
function loop(el, fn, gap) {
  let on = false; let gen = 0;
  const run = async () => { const g = ++gen; while (on && g === gen) { await fn(); if (!on || g !== gen) break; await sleep(gap); } };
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting && !on) { on = true; run(); }
    else if (!e.isIntersecting) on = false;
  }), { threshold: 0.35 });
  io.observe(el);
}
if (!reduce && 'IntersectionObserver' in window) {
  loop(kmField.closest('.km'), playKb, 3200);
  loop($('.dbadge'), playDictation, 2200);
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting && !waveOn) { waveOn = true; requestAnimationFrame(frame); }
    else if (!e.isIntersecting) waveOn = false;
  }), { threshold: 0.1 });
  io.observe(canvas);
}

/* ---------- Talk to the duck: the visitor says three lines; the duck's answers and the marks were recorded from Tyts's model ---------- */
// Recorded 2026-11-01 with Tyts's own instructions (src/duck.ts, src/checker.ts) on Gemma 4 E4B, RTX 2080 SUPER: an answer and the seconds it took.
const TALK = {"free":{"opener":"Hey there! How is your day going so far?","lines":[{"text":"Pretty good! I started running last week, but my legs is still sore.","marks":[["same","Pretty good! I started running last week, but my legs "],["del","is"],["ins","are"],["same"," still sore."]],"notes":{"uk":"is → are: дієслово має узгоджуватися з підметом, 'legs' (множина) вимагає 'are'.","de":"legs is → legs are, weil 'legs' Plural ist und das Verb entsprechend konjugiert werden muss.","es":"El error fue en la concordancia sujeto-verbo: 'legs is' debe ser 'legs are' porque 'legs' es plural.","fr":"Le verbe 'to be' au pluriel est 'are' et non 'is' pour le sujet 'legs'.","it":"Il verbo 'to be' al plurale è 'are' e non 'is'.","pl":"Błąd w zgodzie podmiotu i orzeczenia: 'legs is' powinno być 'legs are', ponieważ 'legs' jest w liczbie mnogiej.","ru":"is → are: подлежащее 'legs' во множественном числе требует глагола 'are'."}},{"text":"How many times a week I should run as a beginner?","marks":[["same","How many times a week "],["del","I"],["same"," should "],["ins","I"],["same"," run as a beginner?"]],"notes":{"uk":"Порядок слів у питанні: допоміжне дієслово (should) ставиться перед підметом (I).","de":"Die Satzstellung ist falsch: 'I should run' wird zu 'should I run' in einer Frage.","es":"El orden de las palabras en la pregunta es incorrecto; el auxiliar 'should' va antes del sujeto 'I'.","fr":"L'ordre des mots est incorrect : 'should' doit venir avant le sujet 'I'.","it":"L'ordine delle parole è sbagliato: 'should' va prima del soggetto 'I'.","pl":"Zmiana szyku zdania: 'I should run' na 'should I run' w pytaniach.","ru":"Порядок слов в вопросе: вспомогательный глагол (should) ставится перед подлежащим (I)."}},{"text":"I run in a park near my house. It is quiet there in the morning.","marks":null}],"answers":{"A2":[["Running is great exercise for your body. Sore legs happen when you start a new activity. I hope you feel better soon.",0.7],["You should start with two or three times a week. Your body needs time to get used to the running. Are you going to run in the park or somewhere else?",0.9],["Parks are a very nice place to run. The trees and fresh air can make exercise feel good. I like walking in big green places too.",0.9]],"B1":[["Running is great for your health. Sore muscles can happen when you start a new workout. It is important to rest your legs a bit after you exercise.",0.8],["I think you should try running three times a week at first. This gives your body time to recover between workouts. Are you enjoying the feeling of running outside?",0.9],["Parks are wonderful places for a run. The quiet in the morning lets you really focus on your breathing. I find that the fresh air helps me think of new ideas.",1]],"B2":[["Running is great for getting some fresh air and feeling good. Those first few days can really put a strain on your muscles. You might want to ease into it slowly to let your legs recover properly.",1.1],["Most experts suggest starting with three times a week when you are just beginning a running routine. It gives your body enough time to adapt to the impact without getting overwhelmed. Are you planning on running outside or on a treadmill?",1.1],["There's something so peaceful about a quiet park at sunrise, isn't there? Those early morning runs can really set a positive tone for the whole day. I always find that the cooler air makes the miles feel a bit easier to tackle.",1.2]]}},"cafe":{"opener":"Hi, welcome in! What can I get for you today?","lines":[{"text":"I would like a large latte with oat milk, please.","marks":null},{"text":"Here, please. How much it costs?","marks":[["same","Here, please. How much "],["ins","does"],["same"," it "],["del","costs"],["ins","cost"],["same","?"]],"notes":{"uk":"How much it costs → How much does it cost: у питальних реченнях з дієсловом 'to cost' потрібно використовувати допоміжне дієслово 'does'.","de":"Das Verb 'cost' benötigt im Englischen bei dieser Frage das Hilfsverb 'does' und die korrekte Satzstellung.","es":"Se usa 'does' para formar preguntas en presente simple.","fr":"Il faut utiliser l'auxiliaire 'does' pour former une question au présent.","it":"Si usa 'does' con il verbo 'cost' in domande al presente semplice.","pl":"Brak czasownika 'does' w pytaniu, poprawnie: How much does it cost?","ru":"How much it costs → How much does it cost: в вопросах в английском языке вспомогательный глагол (does) ставится перед подлежащим."}},{"text":"Okay, and I take one cheesecake too.","marks":[["same","Okay, and "],["del","I"],["ins","I'll"],["same"," take one cheesecake too."]],"notes":{"uk":"take → 'll take: тут потрібна форма майбутнього часу, щоб висловити намір.","de":"Das fehlende Hilfsverb 'will' (I'll) ist notwendig, um die Absicht auszudrücken.","es":"Se agregó 'll para indicar futuro, ya que se está haciendo un pedido.","fr":"Le verbe 'take' au futur est 'will take' ou 'I'll take' pour exprimer une intention.","it":"Ho aggiunto 'll' (will) per indicare che l'azione è futura.","pl":"Dodano 'll (will) dla poprawnego czasu przyszłego.","ru":"I take → I'll take: здесь нужно использовать будущее время (will take) для выражения намерения."}}],"answers":{"A2":[["Sure, we have oat milk. Would you like that to go or drink it here?",0.7],["Okay, that will be four dollars. Can you pay with cash or a card?",0.6],["A cheesecake sounds good. Would you like that with your coffee? We have a chocolate one.",0.7]],"B1":[["Sure thing! A large latte with oat milk it is. Would you like to have that for here or to go?",0.7],["It will be five fifty for here. Would you like to add a pastry with your drink?",0.7],["A cheesecake sounds yummy! So that is one large latte with oat milk and one cheesecake for here. Your total comes to eight fifty. Will you be paying with cash or card?",0.9]],"B2":[["A large latte with oat milk, got it. Would you like to have that here in the cozy corner or take it to go?",0.7],["It'll be six fifty for the large oat milk latte to have in. Anything else you fancy, maybe a croissant or a muffin to go with your coffee?",0.9],["A cheesecake sounds like a lovely treat. Would you prefer a slice of plain cheesecake or one with some toppings?",0.8]]}},"interview":{"opener":"Thanks for coming in today. Could you tell me a little about yourself?","lines":[{"text":"I am product designer. I work in a small studio for five years, and now I want to grow in a bigger team.","marks":[["same","I am "],["ins","a"],["same"," product designer. I "],["del","work"],["ins","have worked"],["same"," in a small studio for five years, and now I want to grow in a bigger team."]],"notes":{"uk":"I am product designer → I am a product designer: перед професією в однині потрібен артикль.","de":"Fehlendes 'a' bei 'product designer' und 'have worked' statt 'work' für eine abgeschlossene Zeitspanne.","es":"Falta el artículo 'a' antes de 'product designer' y se usa el presente perfecto 'have worked' para indicar una acción que comenzó en el pasado y continúa hasta el presente.","fr":"Il manquait l'article 'a' avant 'product designer' et le temps 'have worked' est plus approprié que 'work' pour une action qui a commencé dans le passé et continue jusqu'au présent.","it":"Ho aggiunto l'articolo 'a' prima di 'product designer' e ho cambiato 'I work' in 'I have worked' per indicare un'azione iniziata nel passato e che continua nel presente.","pl":"Brakuje rodzajowego przedimka 'a' przed 'product designer' oraz czas 'have worked' zamiast 'work' dla opisu trwającego stanu.","ru":"I am product designer → I am a product designer: перед профессией нужен артикль."}},{"text":"Mostly mobile apps. I like talking to users and making complex things simple.","marks":null},{"text":"Last year our users didn't found the search button, so we moved it to the top of the screen.","marks":[["same","Last year our users didn't "],["del","found"],["ins","find"],["same"," the search button, so we moved it to the top of the screen."]],"notes":{"uk":"didn't found → didn't find: після допоміжних дієслів (did, didn't) основне дієслово стоїть у початковій формі.","de":"didn't found → didn't find, nach 'did' oder 'didn't' folgt immer die Grundform des Verbs.","es":"El pasado se usa 'find' en lugar de 'found' porque después de 'didn't' el verbo va en infinitivo.","fr":"didn't found → didn't find, après 'did' ou 'didn't', on utilise le verbe à l'infinitif sans 'to'.","it":"Il verbo 'find' al passato con 'didn't' è 'find', non 'found'.","pl":"Błąd w czasowniku 'find' w czasie przeszłym po 'didn't' – po 'did/didn't' używamy formy podstawowej czasownika.","ru":"didn't found → didn't find: после вспомогательного глагола (did/didn't) основной глагол всегда стоит в начальной форме."}}],"answers":{"A2":[["That sounds like a very interesting job. What kind of products do you design?",0.7],["That is very useful in design. Can you tell me about a time you solved a hard problem for a user?",0.8],["That sounds like a big change. How did the users feel about the new search button?",0.7]],"B1":[["That is interesting. What kind of products do you usually design in your work?",0.7],["That sounds like a great skill to have. Can you tell me about a time you solved a difficult problem for a user?",0.8],["That must have been frustrating for the users. How did you know that the search button was causing problems for them?",0.8]],"B2":[["That's really interesting. What kind of product design work have you been doing in your five years at the studio?",0.8],["It sounds like you have a real talent for simplifying complicated ideas, which is a valuable skill. Can you tell me about a particular project where you successfully took something very complex and made it easy for users to understand?",1.1],["That must have been a real pain for users if they couldn't find the main search button. What was the process like when you decided to move it, and what feedback did you get after making that change?",1.2]]}}};
const TK_LEVEL = T.tkLevels;
const tkFeed = $('#tkFeed');
const tkMic = $('#tkMic');
const tkStatusEl = $('#tkStatus');
const tkNextEl = $('#tkNext');
const TK_TILE = $('.tk-head svg.tile').outerHTML;
const tkCanvas = document.createElement('canvas');
tkCanvas.className = 'tk-wave'; tkCanvas.setAttribute('aria-hidden', 'true');
const tkLevels = new Array(30).fill(0.08);
const tk = { topic: 'free', level: 'B1', step: 0, phase: 'idle', run: 0, sid: 0, seen: false, live: null, talking: false, t0: 0, clock: 0, waveOn: false, pushed: 0 };

function tkAnswer(i) { return TALK[tk.topic].answers[tk.level][i]; }
function tkScroll() { tkFeed.scrollTop = tkFeed.scrollHeight; }
function tkAdd(html) { tkFeed.insertAdjacentHTML('beforeend', html); tkScroll(); return tkFeed.lastElementChild; }
// The duck's line as sentences, each knowing where it starts, so the voice can light the one it reads.
function tkSentences(text) {
  const parts = text.match(/[^.!?]+[.!?]+["')]*\s*|[^.!?]+$/g) || [text];
  let at = 0;
  return parts.map((p) => { const html = `<span class="s" data-at="${at}">${esc(p.trimEnd())}</span>`; at += p.length; return html; }).join(' ');
}
function tkDuck(text, i) { return `<div class="tt dk" data-i="${i}">${TK_TILE}<div class="tt-b">${tkSentences(text)}</div></div>`; }
// The person's line as Check my English marks it: the wrong words struck out, the right ones after them, the note under it.
function tkMarked(i) {
  const line = TALK[tk.topic].lines[i];
  if (!line.marks) return `<span>${esc(line.text)}</span>`;
  const m = line.marks.map(([kind, text], k) => kind === 'same' ? esc(text) : `<${kind}>${esc(text)}</${kind}>${kind === 'del' && line.marks[k + 1] && line.marks[k + 1][0] === 'ins' ? ' ' : ''}`).join('');
  return `<span>${m}</span><small class="note">${esc(line.notes[lang] || line.notes.uk)}</small>`;
}
function tkNotes() {
  if (!tkState) return;
  $$('.tt.me[data-i]', tkFeed).forEach((el) => { const n = $('.note', el); const line = TALK[tk.topic].lines[+el.dataset.i]; if (n && line.notes) n.textContent = line.notes[lang] || line.notes.uk; });
}
function tkUnlight() { $$('.s.speaking', tkFeed).forEach((s) => s.classList.remove('speaking')); }
function tkLight(spans, at) { let on = spans[0]; spans.forEach((s) => { if (+s.dataset.at <= at) on = s; }); spans.forEach((s) => s.classList.toggle('speaking', s === on)); }
function tkSettle() { tk.phase = tk.step >= TALK[tk.topic].lines.length ? 'done' : 'idle'; }
// Another reading took the voice, or it was hushed: the duck stops where it was.
function talkVoice(id) {
  if (!tkState || tk.phase !== 'speaking' || tk.sid === id) return;
  tkUnlight(); tkSettle(); tkDraw();
}

function tkPaintWave() {
  const dpr = Math.min(2, devicePixelRatio || 1);
  const r = tkCanvas.getBoundingClientRect();
  if (!r.width) return;
  tkCanvas.width = Math.round(r.width * dpr); tkCanvas.height = Math.round(r.height * dpr);
  const c = tkCanvas.getContext('2d'); const w = tkCanvas.width, h = tkCanvas.height;
  const n = tkLevels.length; const step = w / n; const bw = Math.max(1.5, step * 0.5);
  c.clearRect(0, 0, w, h); c.fillStyle = markColor(); c.globalAlpha = 0.75;
  for (let i = 0; i < n; i++) {
    const bh = Math.max(bw, tkLevels[i] * h); const x = i * step + (step - bw) / 2;
    c.beginPath(); if (c.roundRect) c.roundRect(x, (h - bh) / 2, bw, bh, bw / 2); else c.rect(x, (h - bh) / 2, bw, bh); c.fill();
  }
}
function tkWaveFrame(t) {
  if (tk.phase !== 'listening') { tk.waveOn = false; return; }
  if (t - tk.pushed > 50) { tk.pushed = t; tkLevels.shift(); tkLevels.push(tk.talking ? 0.25 + Math.random() * 0.7 : 0.06 + Math.random() * 0.04); tkPaintWave(); }
  requestAnimationFrame(tkWaveFrame);
}

function tkDraw() {
  const k = keysSet.talk;
  const press = k ? `<span class="keys">${capsHtml(k)}</span>` : `<span>${T.tk.button}</span>`;
  const lines = TALK[tk.topic].lines;
  tkMic.className = 'tk-mic' + (tk.phase === 'listening' ? ' listening' : tk.phase === 'checking' ? ' busy' : '');
  tkMic.innerHTML = ico(tk.phase === 'listening' ? 'send-horizontal' : tk.phase === 'done' ? 'rotate-ccw' : tk.phase === 'checking' ? 'loader' : 'mic');
  const label = tk.phase === 'listening' ? T.tk.send : tk.phase === 'done' ? T.tk.restart : tk.phase === 'speaking' ? T.tk.stop : T.tk.say;
  tkMic.setAttribute('aria-label', label); tkMic.title = label;
  if (tk.phase === 'listening') {
    tkStatusEl.innerHTML = `<span class="rec"></span><span>${T.tk.listening}</span>${press}<span>${T.tk.toSend}</span><span class="time">0:00</span>`;
    tkStatusEl.appendChild(tkCanvas); tkTime(); tkPaintWave();
  } else if (tk.phase === 'checking') tkStatusEl.innerHTML = `<span>${T.tk.thinking}</span>`;
  else if (tk.phase === 'speaking') tkStatusEl.innerHTML = `${ico('volume-2')}<span>${T.tk.speaking}</span>${press}<span>${T.tk.toAnswer}</span>`;
  else if (tk.phase === 'done') tkStatusEl.innerHTML = `<span>${T.tk.done}</span>`;
  else tkStatusEl.innerHTML = `<span>${T.tk.press}</span>${press}<span>${T.tk.toSay}</span>`;
  const next = tk.phase === 'checking' || tk.phase === 'speaking' ? tk.step + (tk.phase === 'checking' ? 1 : 0) : tk.step;
  if (tk.phase === 'done') tkNextEl.innerHTML = `<span class="line">${T.tk.said}</span><button type="button" data-tk="again">${ico('rotate-ccw')}${T.tk.again}</button>`;
  else if (next >= lines.length) tkNextEl.innerHTML = `<span class="line">${T.tk.last}</span>`;
  else if (tk.phase === 'listening') tkNextEl.innerHTML = `<span class="lab">Esc</span><span class="line">${T.tk.drops}</span>`;
  else tkNextEl.innerHTML = `<span class="lab">${T.tk.yourLine}</span><span class="line">${esc(lines[next].text)}</span>`;
}
function tkTime() {
  const t = $('.time', tkStatusEl); if (!t) return;
  const s = Math.floor((performance.now() - tk.t0) / 1000); t.textContent = `0:${String(s).padStart(2, '0')}`;
}

function tkReset() {
  tk.run++;
  if (tk.phase === 'speaking' || tk.talking) hush();
  tk.talking = false;
  clearInterval(tk.clock);
  tk.step = 0; tk.phase = 'idle'; tk.live = null;
  tkFeed.innerHTML = tkDuck(TALK[tk.topic].opener, -1);
  tkDraw();
}
// The line is said aloud by a woman's voice and heard word by word, as Tyts shows it in a dashed line while you speak.
async function tkListen() {
  quietCard(); hush();
  const run = ++tk.run; const alive = () => run === tk.run;
  const text = TALK[tk.topic].lines[tk.step].text;
  const words = text.split(' ');
  tk.phase = 'listening'; tk.t0 = performance.now(); tk.talking = true;
  tk.live = tkAdd('<div class="tt me live"><div class="tt-b"><span class="said"></span></div></div>');
  const said = $('.said', tk.live);
  clearInterval(tk.clock); tk.clock = setInterval(() => { if (!alive() || tk.phase !== 'listening') { clearInterval(tk.clock); return; } tkTime(); }, 250);
  tkDraw();
  if (!tk.waveOn && !reduce) { tk.waveOn = true; requestAnimationFrame(tkWaveFrame); }
  const stopped = () => { if (alive()) tk.talking = false; };
  if (reduce) { said.textContent = text; speak(text, { who: 'her', onend: stopped }); return; }
  await sleep(300);
  if (!alive()) return;
  const starts = []; words.reduce((at, w) => { starts.push(at); return at + w.length + 1; }, 0);
  let shown = 0;
  const upTo = (at) => {
    if (!alive()) return;
    while (shown < words.length && starts[shown] <= at) { said.insertAdjacentHTML('beforeend', `<span class="w">${shown ? ' ' : ''}${esc(words[shown])}</span>`); shown++; }
    tkScroll();
  };
  speak(text, { who: 'her', onword: upTo, onend: () => { upTo(text.length); stopped(); } });
}
// Sent: Tyts checks the line and the duck thinks at once; the marks come first, then the answer, read aloud.
async function tkSend() {
  const run = ++tk.run; const alive = () => run === tk.run;
  const i = tk.step; const el = tk.live; tk.live = null;
  clearInterval(tk.clock);
  if (tk.talking) { hush(); tk.talking = false; }
  el.classList.remove('live'); el.dataset.i = i;
  $('.tt-b', el).innerHTML = `<span>${esc(TALK[tk.topic].lines[i].text)}</span><small class="checking">${ico('loader')}checking…</small>`;
  tk.phase = 'checking'; tkDraw();
  const dots = tkAdd(`<div class="tt dk typing">${TK_TILE}<div class="tt-b"><span class="dots"><i></i><i></i><i></i></span></div></div>`);
  const took = tkAnswer(i)[1] * 1000;
  await sleep(Math.min(600, took - 100));
  if (!alive()) return;
  $('.tt-b', el).innerHTML = tkMarked(i); tkScroll();
  await sleep(Math.max(150, took - 600));
  if (!alive()) return;
  dots.remove();
  tkShow(i, true);
}
function tkShow(i, voice) {
  const el = tkAdd(tkDuck(tkAnswer(i)[0], i));
  tk.step = i + 1;
  if (!voice || !tk.seen) { tkSettle(); tkDraw(); return; }
  const run = tk.run; const spans = $$('.s', el);
  speak(tkAnswer(i)[0], { who: 'him', onword: (at) => tkLight(spans, at), onend: () => { if (run !== tk.run || tk.phase !== 'speaking') return; tkUnlight(); tkSettle(); tkDraw(); } });
  tk.sid = speakId; tk.phase = 'speaking'; tkDraw();
}
// A press while the duck thinks shows its answer at once, as a press in Tyts does not wait for it.
function tkHurry() {
  tk.run++;
  const i = tk.step;
  const el = $(`.tt.me[data-i="${i}"]`, tkFeed); if (el) $('.tt-b', el).innerHTML = tkMarked(i);
  const dots = $('.tt.dk.typing', tkFeed); if (dots) dots.remove();
  tkShow(i, false);
}
function tkPress() {
  if (tk.phase === 'done') { tkReset(); return; }
  if (tk.phase === 'listening') { tkSend(); return; }
  if (tk.phase === 'checking') tkHurry();
  if (tk.phase === 'speaking') hush();
  if (tk.phase === 'idle') tkListen();
}
function tkCancel() {
  if (!tkState || tk.phase !== 'listening') return false;
  tk.run++; clearInterval(tk.clock);
  if (tk.talking) { hush(); tk.talking = false; }
  if (tk.live) tk.live.remove();
  tk.live = null; tk.phase = 'idle'; tkDraw();
  return true;
}
function tkKey() {
  if (!tkState) return;
  if (!tk.seen) $('#talk').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  tkPress();
}
function tkSetLevel(l) {
  tk.level = l;
  $$('#tkLevels button').forEach((b) => b.setAttribute('aria-checked', b.dataset.l === l));
  $('#tkLevelNote').innerHTML = `<b>${TK_LEVEL[l][0]}:</b> ${TK_LEVEL[l][1]}`;
  if (tk.phase === 'speaking') hush();
  // The same talk at another level: the duck's recorded answers for it, in place.
  $$('.tt.dk[data-i]', tkFeed).forEach((el) => { const i = +el.dataset.i; if (i >= 0) $('.tt-b', el).innerHTML = tkSentences(tkAnswer(i)[0]); });
  tkScroll();
}
function tkSetTopic(t) {
  tk.topic = t;
  $$('#tkTopics button').forEach((b) => b.setAttribute('aria-checked', b.dataset.t === t));
  tkReset();
}
tkMic.addEventListener('click', tkPress);
tkNextEl.addEventListener('click', (e) => { if (e.target.closest('[data-tk="again"]')) tkReset(); });
$('#tkLevels').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b && b.dataset.l !== tk.level) tkSetLevel(b.dataset.l); });
$('#tkTopics').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b && b.dataset.t !== tk.topic) tkSetTopic(b.dataset.t); });
tkState = tk;
tkSetLevel('B1');
tkReset();
// Out of view, the duck says nothing and a line being said is dropped.
if ('IntersectionObserver' in window) {
  new IntersectionObserver((es) => es.forEach((e) => {
    tk.seen = e.isIntersecting;
    if (!e.isIntersecting) { tkCancel(); if (tk.phase === 'speaking') hush(); }
  }), { threshold: 0.2 }).observe($('#talk'));
} else tk.seen = true;

/* ---------- The duck says krya ---------- */
const quack = $('#quack');
quack.addEventListener('click', () => {
  quietCard();
  quack.classList.add('talk');
  if (pickVoice(DEMO.quack)) speak('Тиць!', { lang: DEMO.quack }); else speak('Tyts!');
  setTimeout(() => quack.classList.remove('talk'), 260);
  setTimeout(() => quack.classList.add('talk'), 380);
  setTimeout(() => quack.classList.remove('talk'), 640);
});
})();
