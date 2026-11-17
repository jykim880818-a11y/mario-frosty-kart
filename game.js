'use strict';

const $ = (id) => document.getElementById(id);
const canvas = $('race');
const render = createScene(canvas);
const START = 70;
const LINE = 350;
const LAPS = 3;
const FINISH = LINE + COURSE * LAPS;
const drivingKeys = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD']);
const keys = new Set();
const touchKeys = new Set();
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const pressed = (...codes) => codes.some((code) => keys.has(code) || touchKeys.has(code));

const tones = {
  count: [52],
  go: [72, 79],
  pickup: [72, 76, 81],
  boost: [55, 62, 67, 74],
  lap: [67, 71, 74, 79],
  finish: [72, 76, 79, 88],
  bump: [45, 39],
};

function createAudio() {
  let context;
  let output;
  let enabled = true;
  let nextBeat = 0;
  let beat = 0;
  const tune = [
    76, 79, 81, 79, 76, 74, 72, 0, 74, 76, 79, 76, 74, 72, 69, 0,
    72, 76, 77, 81, 79, 77, 76, 0, 74, 77, 79, 83, 81, 79, 74, 0,
    76, 79, 84, 83, 81, 79, 76, 0, 74, 76, 79, 76, 72, 76, 74, 0,
    77, 81, 84, 81, 79, 76, 74, 76, 79, 76, 74, 71, 72, 0, 67, 0,
  ];
  const roots = [48, 48, 45, 45, 53, 53, 55, 55, 48, 48, 45, 45, 53, 53, 55, 48];

  function unlock() {
    const AudioEngine = window.AudioContext || window.webkitAudioContext;
    if (!AudioEngine) return;
    if (!context) {
      context = new AudioEngine();
      output = context.createGain();
      output.gain.value = enabled ? 1 : 0;
      output.connect(context.destination);
    }
    if (context.state === 'suspended') context.resume().catch(() => {});
  }

  function play(note, at, duration, volume, type = 'square') {
    if (!note) return;
    const wave = context.createOscillator();
    const envelope = context.createGain();
    wave.type = type;
    wave.frequency.value = 440 * 2 ** ((note - 69) / 12);
    envelope.gain.setValueAtTime(.001, at);
    envelope.gain.exponentialRampToValueAtTime(volume, at + .007);
    envelope.gain.exponentialRampToValueAtTime(.001, at + duration);
    wave.connect(envelope).connect(output);
    wave.start(at);
    wave.stop(at + duration + .01);
  }

  return {
    unlock,
    toggle() {
      enabled = !enabled;
      unlock();
      if (output) output.gain.setTargetAtTime(enabled ? 1 : 0, context.currentTime, .025);
      return enabled;
    },
    effect(name) {
      if (!context || !enabled) return;
      tones[name].forEach((note, index) => play(note, context.currentTime + index * .082, .13, .075, name === 'bump' ? 'sawtooth' : 'square'));
    },
    music(active) {
      if (!context || context.state !== 'running') return;
      if (!active || !enabled) {
        nextBeat = 0;
        return;
      }
      if (nextBeat < context.currentTime - .12) nextBeat = context.currentTime + .024;
      while (nextBeat < context.currentTime + .12) {
        play(tune[beat % tune.length], nextBeat, .12, .034);
        if (beat % 2 === 0) {
          const bass = roots[Math.floor(beat / 4) % roots.length];
          play(bass + (beat % 4 ? 7 : 0), nextBeat, .19, .06, 'triangle');
        }
        if (beat % 2 === 1) play(tune[beat % tune.length] + 12, nextBeat, .067, .027, 'sine');
        beat++;
        nextBeat += .143;
      }
    },
  };
}

const audio = createAudio();
let state = 'idle';
let player;
let opponents;
let boxes;
let elapsed;
let countdown;
let toastTime;
let oldOrder = '';
let finalOrder;

const ranks = RACERS.map((racer, id) => {
  const row = document.createElement('li');
  row.classList.toggle('player', id === 0);
  const number = document.createElement('span');
  number.className = 'rank-number';
  const icon = document.createElement('canvas');
  icon.width = 24;
  icon.height = 24;
  icon.setAttribute('aria-hidden', 'true');
  const paint = icon.getContext('2d');
  paint.translate(12, 22);
  portrait(paint, id);
  const name = document.createElement('span');
  name.textContent = racer.name;
  const tag = document.createElement('span');
  tag.className = 'you';
  tag.textContent = id === 0 ? 'YOU' : '';
  row.append(number, icon, name, tag);
  return { row, number };
});

function reset() {
  player = { id: 0, d: START, x: 0, speed: 0, slide: 0, boost: 0, item: false, hit: 0 };
  opponents = [
    { id: 1, offset: 125, lane: -.39, speed: 365 },
    { id: 2, offset: 172, lane: .34, speed: 369 },
    { id: 3, offset: 75, lane: .56, speed: 349 },
    { id: 4, offset: 78, lane: -.64, speed: 343 },
    { id: 5, offset: 121, lane: .07, speed: 356 },
  ].map((rival) => ({ ...rival, d: START + rival.offset, x: rival.lane }));
  boxes = [];
  for (let lap = 0; lap < LAPS; lap++) {
    for (const [offset, lane] of [[244, -.71], [248, .73], [826, -.42], [829, .45], [1840, 0], [2610, -.65], [2610, .61], [3660, -.22], [4490, .51]]) {
      boxes.push({ point: lap * COURSE + offset, lane, variant: Number(lane > 0), taken: false });
    }
  }
  elapsed = 0;
  countdown = 3;
  toastTime = 0;
  finalOrder = null;
  $('race-message').textContent = '';
  $('result').hidden = true;
  updateHud();
}

function standings() {
  return finalOrder ?? [player, ...opponents].sort((a, b) => b.d - a.d);
}

function raceTime(seconds) {
  const ticks = Math.floor(seconds * 100);
  return [Math.floor(ticks / 6000), Math.floor(ticks / 100) % 60, ticks % 100]
    .map((part) => String(part).padStart(2, '0'))
    .join(':').replace(/:(\d\d)$/, '.$1');
}

function currentLap() {
  return clamp(Math.floor((player.d - LINE) / COURSE) + 1, 1, LAPS);
}

function updateHud() {
  const order = standings();
  const orderKey = order.map((racer) => racer.id).join('');
  if (oldOrder !== orderKey) {
    oldOrder = orderKey;
    $('ranking').replaceChildren(...order.map(({ id }, index) => {
      const { row, number } = ranks[id];
      number.textContent = String(index + 1);
      return row;
    }));
    $('place').firstChild.nodeValue = String(order.findIndex(({ id }) => id === 0) + 1);
  }
  $('lap').firstChild.nodeValue = String(currentLap());
  $('speed').textContent = Math.round(player.speed * .42);
  $('timer').textContent = raceTime(elapsed);
  $('item').textContent = player.item ? '부스터 준비!' : player.boost > 0 ? '부스터 사용 중' : '선물 상자 없음';
  $('item').parentElement.classList.toggle('ready', player.item || player.boost > 0);
}

function announce(message, duration) {
  $('race-message').textContent = message;
  toastTime = duration;
}

function startRace() {
  if (state !== 'idle' && state !== 'finished') return;
  audio.unlock();
  reset();
  state = 'countdown';
  $('start-ui').hidden = true;
  announce('3', 3);
  audio.effect('count');
}

function useItem() {
  if (state === 'race' && player.item) {
    player.item = false;
    player.boost = 1.9;
    audio.effect('boost');
  }
}

function finishRace() {
  finalOrder = standings();
  const place = finalOrder.indexOf(player) + 1;
  state = 'finished';
  player.speed = 0;
  announce('FINISH!', 2);
  audio.effect('finish');
  $('result').textContent = `${place === 1 ? '🏆 우승!' : `최종 ${place}위`} · ${raceTime(elapsed)}`;
  $('result').hidden = false;
  $('start').lastChild.nodeValue = ' 다시 레이스';
  $('start-ui').hidden = false;
}

function updateRace(dt) {
  elapsed += dt;
  const priorLap = currentLap();
  const previous = player.d;
  const accelerate = pressed('ArrowUp', 'KeyW');
  const brake = pressed('ArrowDown', 'KeyS');
  const direction = Number(pressed('ArrowRight', 'KeyD')) - Number(pressed('ArrowLeft', 'KeyA'));
  const drift = pressed('ShiftLeft', 'ShiftRight') && direction !== 0 && player.speed > 140;
  player.boost = Math.max(0, player.boost - dt);
  player.hit = Math.max(0, player.hit - dt);
  const traction = Math.min(1, player.speed / 170);
  const offRoad = Math.abs(player.x) > 1.03;
  const limit = player.boost > 0 ? 610 : offRoad ? 222 : drift ? 395 : 425;
  const force = brake ? -610 : player.boost > 0 ? 620 : accelerate ? 278 : -126;
  player.speed = Math.max(0, player.speed + (player.speed > limit ? -390 : force) * dt);
  const curve = bend(player.d + 95);
  const steering = direction * (drift ? 1.78 : 1.22) * traction;
  player.slide += (steering + curve * .43 * traction ** 2 - player.slide) * Math.min(1, dt * (drift ? 2.3 : 4.1));
  player.x = clamp(player.x + player.slide * dt, -1.35, 1.35);
  player.d = Math.min(FINISH, player.d + player.speed * dt);

  for (const rival of opponents) {
    const pace = rival.speed * Math.min(1, .48 + elapsed * .44);
    rival.d = Math.min(FINISH + 24 - rival.id, rival.d + (pace + Math.sin(elapsed * .82 + rival.id * 1.7) * 22) * dt);
    rival.x = clamp(rival.lane + Math.sin(elapsed * .86 + rival.id * 2) * .22 - bend(rival.d) * .1, -.86, .86);
    if (Math.abs(rival.d - player.d) < 16 && Math.abs(rival.x - player.x) < .16 && !player.hit) {
      player.hit = .75;
      if (player.boost <= 0) {
        player.speed *= .79;
        player.x = clamp(player.x + (player.x < rival.x ? -.10 : .10), -1.35, 1.35);
        audio.effect('bump');
      }
    }
  }
  if (!player.item) {
    const box = boxes.find((entry) => !entry.taken && entry.point >= previous - 13 && entry.point <= player.d + 13 && Math.abs(player.x - entry.lane) < .22);
    if (box) {
      box.taken = true;
      player.item = true;
      audio.effect('pickup');
    }
  }
  if (priorLap !== currentLap()) {
    audio.effect('lap');
    announce(currentLap() === LAPS ? 'FINAL LAP!' : 'LAP ' + currentLap(), 1.15);
  }
  if (player.d >= FINISH) finishRace();
}

function frame(now) {
  const dt = Math.min(.04, (now - (frame.last ?? now)) / 1000);
  frame.last = now;
  if (state === 'countdown') {
    const oldCount = Math.ceil(countdown);
    countdown -= dt;
    if (countdown <= 0) {
      state = 'race';
      announce('GO!', .82);
      audio.effect('go');
    } else if (Math.ceil(countdown) !== oldCount) {
      announce(String(Math.ceil(countdown)), 3);
      audio.effect('count');
    }
  } else if (state === 'race') {
    updateRace(dt);
  }
  if (toastTime > 0) {
    toastTime -= dt;
    if (toastTime <= 0) $('race-message').textContent = '';
  }
  updateHud();
  audio.music(state === 'race');
  render({ distance: player.d - 39, player, opponents, boxes, time: now / 1000, idle: state === 'idle' });
  requestAnimationFrame(frame);
}

window.addEventListener('keydown', (event) => {
  if (event.altKey || event.metaKey || event.ctrlKey) return;
  if (event.code === 'Enter' && event.target.tagName !== 'BUTTON') {
    event.preventDefault();
    startRace();
  }
  if (!drivingKeys.has(event.code) || (event.code === 'Space' && event.target.tagName === 'BUTTON')) return;
  event.preventDefault();
  keys.add(event.code);
  if (event.code === 'Space' && !event.repeat) useItem();
});
window.addEventListener('keyup', (event) => keys.delete(event.code));
window.addEventListener('blur', () => {
  keys.clear();
  touchKeys.clear();
});
for (const button of document.querySelectorAll('[data-key]')) {
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    touchKeys.add(button.dataset.key);
    if (button.dataset.key === 'Space') useItem();
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    button.addEventListener(type, () => touchKeys.delete(button.dataset.key));
  }
}
$('start').addEventListener('click', () => {
  $('start').blur();
  startRace();
});
$('sound').addEventListener('click', () => {
  const enabled = audio.toggle();
  $('sound').setAttribute('aria-pressed', String(enabled));
  $('sound-icon').textContent = enabled ? '♫' : '×';
  $('sound-label').textContent = enabled ? '사운드 켜짐' : '사운드 꺼짐';
  if (enabled) audio.effect('pickup');
});

reset();
requestAnimationFrame(frame);
