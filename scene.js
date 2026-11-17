'use strict';

const COURSE = 5200;
const WIDTH = 480;
const HEIGHT = 288;
const HORIZON = 124;
const VIEW = 1700;
const RACERS = [
  { name: '마리오', hat: '#f44755', shade: '#a41f43', cart: '#ee4557', mark: 'M' },
  { name: '루이지', hat: '#57d261', shade: '#21794c', cart: '#44ba70', mark: 'L' },
  { name: '피치', hat: '#fc95cb', shade: '#c94c8d', cart: '#ef6bac', mark: 'P' },
  { name: '요시', hat: '#9ae154', shade: '#399952', cart: '#91cd4c', mark: 'Y' },
  { name: '키노피오', hat: '#fff0de', shade: '#d55c71', cart: '#4ea6f6', mark: 'T' },
  { name: '쿠파', hat: '#edb858', shade: '#c46942', cart: '#efad54', mark: 'B' },
];

function mod(number, size) {
  return (number % size + size) % size;
}

function random(seed) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function rect(ctx, color, x, y, width, height) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

function polygon(ctx, color, points) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.closePath();
  ctx.fill();
}

function bend(distance) {
  const phase = distance / COURSE * Math.PI * 2;
  return .64 * Math.sin(phase * 2 - .4) + .32 * Math.sin(phase * 3 + .9);
}

function projection(distance, ahead, camera) {
  const scale = 1 / (1 + Math.max(0, ahead) / 167);
  const turn = bend(distance + ahead * .32);
  return {
    y: HORIZON + (HEIGHT - HORIZON + 5) * scale,
    x: WIDTH / 2 - 33 * camera * scale + turn * (1 - scale) * 124,
    half: 245 * scale,
    scale,
  };
}

function pine(ctx, x, y, scale, lights = false) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(scale, scale);
  polygon(ctx, '#80a6cb', [[-25, 1], [10, -3], [33, 3], [19, 8], [-12, 8]]);
  rect(ctx, '#70516b', -4, -12, 9, 14);
  const tiers = [[-83, 12, -54], [-71, 18, -42], [-57, 22, -26], [-42, 27, -12]];
  for (const [top, width, bottom] of tiers.reverse()) {
    polygon(ctx, '#223e59', [[0, top], [width, bottom - 6], [width - 2, bottom], [-width, bottom], [-width, bottom - 5]]);
    polygon(ctx, '#36657a', [[0, top], [-width, bottom - 5], [-4, bottom - 4], [0, bottom - 9]]);
    polygon(ctx, '#bad8e8', [[0, top], [width * .83, bottom - 9], [width * .4, bottom - 8], [3, bottom - 14], [-8, bottom - 9], [-width * .8, bottom - 8]]);
    polygon(ctx, '#f4f8ff', [[0, top], [1, bottom - 16], [-9, bottom - 11], [-width * .7, bottom - 10]]);
  }
  if (lights) {
    const bulbs = [[-4,-69], [8,-58], [-9,-51], [2,-46], [13,-43], [-13,-34], [5,-31], [18,-22], [-19,-19], [-3,-19]];
    bulbs.forEach(([bx, by], i) => {
      const color = ['#ff6c80', '#ffd16b', '#7ff2e9'][i % 3];
      rect(ctx, color + '55', bx - 1, by - 1, 5, 5);
      rect(ctx, color, bx, by, 3, 3);
    });
    rect(ctx, '#fff3a0', -1, -90, 3, 9);
    rect(ctx, '#fff3a0', -4, -87, 9, 3);
  }
  ctx.restore();
}

function cabin(ctx, x, y, scale, variant) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(scale, scale);
  const wall = ['#a55061', '#95637b', '#866379'][variant % 3];
  polygon(ctx, '#91abc9', [[-36, 2], [18, -7], [52, 4], [31, 11], [-26, 9]]);
  rect(ctx, wall, -25, -42, 51, 42);
  rect(ctx, '#653e59', 12, -43, 14, 43);
  rect(ctx, '#926072', 12, -67, 8, 21);
  rect(ctx, '#eef4ff', 11, -70, 10, 4);
  polygon(ctx, '#8c3756', [[-33,-39], [-4,-70], [5,-70], [33,-39], [29,-32], [-29,-32]]);
  polygon(ctx, '#f2f6ff', [[-35,-42], [-4,-73], [5,-73], [35,-43], [28,-39], [17,-41], [8,-51], [2,-56], [-7,-50], [-14,-42], [-27,-39]]);
  rect(ctx, '#592f48', -5, -21, 12, 21);
  rect(ctx, '#ffd481', -19, -28, 10, 11);
  rect(ctx, '#ffad73', 12, -27, 9, 10);
  rect(ctx, '#875567', -15, -28, 2, 11);
  rect(ctx, '#875567', -19, -24, 10, 2);
  rect(ctx, '#ffe194', 3, -11, 2, 2);
  for (let i = 0; i < 8; i++) rect(ctx, ['#ff8590','#ffdb89','#8beddf'][i % 3], -22 + 6 * i, -34 + (i % 2), 2, 2);
  rect(ctx, '#e1ebf8', -26, -3, 54, 4);
  ctx.restore();
}

function sky() {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 150);
  gradient.addColorStop(0, '#172657');
  gradient.addColorStop(.56, '#40487b');
  gradient.addColorStop(1, '#a5779c');
  rect(ctx, gradient, 0, 0, WIDTH, HEIGHT);
  for (let i = 0; i < 120; i++) {
    const x = Math.floor(random(i) * WIDTH);
    const y = Math.floor(random(i + 300) * 121);
    rect(ctx, i % 4 ? '#aab9e69c' : '#f7e2bf', x, y, i % 13 ? 1 : 2, 1);
  }
  for (const [x, y] of [[65,42], [128,24], [230,55], [308,24], [414,53], [442,29], [167,62]]) {
    rect(ctx, '#d7e2ff', x - 2, y, 5, 1);
    rect(ctx, '#d7e2ff', x, y - 2, 1, 5);
  }
  polygon(ctx, '#ede7cb15', [[344,12],[366,12],[384,30],[384,53],[366,70],[343,70],[326,53],[326,30]]);
  polygon(ctx, '#ffedc1', [[346,22],[364,22],[364,26],[372,26],[372,33],[376,33],[376,51],[372,51],[372,57],[364,57],[364,61],[346,61],[346,57],[339,57],[339,51],[335,51],[335,33],[339,33],[339,26],[346,26]]);
  rect(ctx, '#ead8b3', 345, 43, 7, 4);
  rect(ctx, '#ead8b3', 359, 28, 5, 3);
  rect(ctx, '#ead8b3', 364, 48, 6, 4);
  for (let i = 0; i < 9; i++) {
    const x = i * 66 - 25;
    const peak = 56 + Math.round(random(i + 20) * 35);
    polygon(ctx, '#515e91', [[x-56,142],[x-19,peak+18],[x,peak],[x+19,peak+14],[x+62,142]]);
    polygon(ctx, '#7588b5', [[x,peak],[x+17,peak+13],[x+42,peak+48],[x+12,peak+40],[x+3,peak+23],[x-9,peak+27],[x-20,peak+22]]);
    polygon(ctx, '#b2c2df', [[x,peak],[x+17,peak+13],[x+25,peak+24],[x+11,peak+20],[x+3,peak+12],[x-8,peak+18],[x-17,peak+20]]);
  }
  polygon(ctx, '#92a9ce', [[0,127],[72,103],[121,116],[187,112],[230,131],[301,111],[338,121],[396,104],[480,122],[480,162],[0,163]]);
  for (let i = 0; i < 42; i++) {
    const x = i * 12 + random(i + 900) * 12;
    const s = .12 + random(i + 8) * .18;
    pine(ctx, x, 128 + random(i + 3) * 15, s);
  }
  return canvas;
}

function portrait(ctx, id) {
  const { hat, shade, mark } = RACERS[id];
  rect(ctx, '#30243d', -8, -13, 16, 12);
  rect(ctx, '#f4bd93', -7, -11, 14, 8);
  rect(ctx, '#ffdbaf', -3, -9, 6, 7);
  if (id === 2) {
    rect(ctx, '#ffcf64', -8, -15, 16, 5);
    rect(ctx, '#ffcf64', -9, -12, 3, 12);
    rect(ctx, '#ffcf64', 6, -12, 3, 12);
    rect(ctx, '#fdd981', -4, -18, 8, 3);
    rect(ctx, '#77def4', -1, -17, 2, 3);
  } else if (id === 3 || id === 5) {
    rect(ctx, shade, -9, -13, 18, 9);
    rect(ctx, hat, -7, -17, 14, 11);
    rect(ctx, '#f8ead1', -5, -13, 4, 5);
    rect(ctx, '#f8ead1', 1, -13, 4, 5);
    rect(ctx, id === 5 ? '#f57d52' : hat, -4, -8, 8, 5);
    if (id === 5) {
      rect(ctx, '#fff4d4', -9, -17, 3, 5);
      rect(ctx, '#fff4d4', 6, -17, 3, 5);
    }
  } else {
    rect(ctx, shade, -9, -17, 18, 7);
    rect(ctx, hat, -7, -19, 14, 6);
    rect(ctx, hat, -10, -13, 20, 2);
    rect(ctx, id === 4 ? '#ec5569' : '#fff0e3', -3, -18, 6, 5);
    if (id !== 4) {
      ctx.fillStyle = shade;
      ctx.font = 'bold 5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(mark, 0, -14);
      rect(ctx, '#784451', -5, -6, 10, 2);
    }
  }
  rect(ctx, '#22273c', -4, -10, 2, 2);
  rect(ctx, '#22273c', 2, -10, 2, 2);
}

function drawKart(ctx, x, y, scale, id, steer = 0, boost = false) {
  const racer = RACERS[id];
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(scale, scale);
  polygon(ctx, '#27395670', [[-25,-1],[-14,-8],[16,-8],[27,-2],[20,4],[-19,4]]);
  ctx.rotate(steer * .11);
  rect(ctx, '#192239', -19, -10, 8, 11);
  rect(ctx, '#192239', 11, -10, 8, 11);
  rect(ctx, '#3f4c68', -18, -7, 3, 7);
  rect(ctx, '#3f4c68', 15, -7, 3, 7);
  rect(ctx, racer.shade, -15, -13, 30, 10);
  rect(ctx, racer.cart, -13, -16, 26, 9);
  rect(ctx, '#ffe0a3', -12, -9, 4, 3);
  rect(ctx, '#ffe0a3', 8, -9, 4, 3);
  rect(ctx, '#ede6e3', -6, -6, 12, 3);
  ctx.save();
  ctx.translate(0, -12);
  portrait(ctx, id);
  ctx.restore();
  if (boost) {
    polygon(ctx, '#ff994f', [[-9,-2],[-3,-2],[-5,9],[-9,5]]);
    polygon(ctx, '#ff994f', [[3,-2],[9,-2],[9,5],[5,10]]);
    rect(ctx, '#fff0a3', -7, -1, 3, 5);
    rect(ctx, '#fff0a3', 5, -1, 3, 5);
  }
  ctx.restore();
}

function candy(ctx, x, y, s) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(s, s);
  rect(ctx, '#fff2ef', -3, -34, 6, 34);
  rect(ctx, '#fff2ef', 1, -37, 9, 6);
  rect(ctx, '#fff2ef', 8, -35, 6, 12);
  for (let i = 0; i < 5; i++) polygon(ctx, '#e75a70', [[-3,-32+i*7],[3,-35+i*7],[3,-32+i*7],[-3,-29+i*7]]);
  rect(ctx, '#e75a70', 5, -37, 3, 6);
  rect(ctx, '#e75a70', 8, -29, 6, 3);
  ctx.restore();
}

function gift(ctx, x, y, scale, time, variant) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(scale, scale);
  const color = variant ? '#62cbbb' : '#f16876';
  const ribbon = variant ? '#ffb3d4' : '#ffdc83';
  rect(ctx, '#304c6d77', -9, -2, 18, 4);
  const bob = Math.round(Math.sin(time * 5 + variant) * 2);
  rect(ctx, color, -8, -14 + bob, 16, 12);
  rect(ctx, variant ? '#35a399' : '#bc4b66', 4, -14 + bob, 4, 12);
  rect(ctx, ribbon, -2, -16 + bob, 4, 14);
  rect(ctx, color, -9, -15 + bob, 18, 3);
  rect(ctx, ribbon, -9, -15 + bob, 18, 2);
  rect(ctx, ribbon, -6, -20 + bob, 5, 4);
  rect(ctx, ribbon, 1, -20 + bob, 5, 4);
  ctx.restore();
}

function arch(ctx, p, time) {
  const width = p.half * 2.24;
  const height = p.half * 1.22;
  const left = p.x - width / 2;
  const right = p.x + width / 2;
  const top = p.y - height;
  const post = p.half * .11;
  const beam = p.half * .34;
  for (const x of [left, right - post]) {
    rect(ctx, '#7c3b59', x, top, post, height);
    for (let i = 0; i < 6; i++) {
      const y = top + i * height / 6;
      polygon(ctx, '#e37b83', [[x,y+post*.55],[x+post,y],[x+post,y+post*.64],[x,y+post*1.19]]);
    }
  }
  rect(ctx, '#532d4b', left - post * .25, top, width + post * .5, beam);
  rect(ctx, '#ac405d', left, top, width, beam * .79);
  polygon(ctx, '#f3f7ff', [[left-post*.4,top],[left,top-beam*.27],[right,top-beam*.27],[right+post*.4,top],[right+post*.32,top+beam*.13],[left-post*.3,top+beam*.13]]);
  for (let i = 1; i < 23; i++) {
    const x = left + width * i / 23;
    const colors = ['#ffb974', '#a1f9d9', '#ff989b'];
    rect(ctx, colors[(i + Math.floor(time * 2)) % 3], x, top + beam * .72, Math.max(1, post * .28), Math.max(1, post * .27));
  }
  if (width > 38) {
    ctx.font = `900 ${Math.max(5, Math.round(beam * .44))}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff4db';
    ctx.fillText('MERRY CHRISTMAS', Math.round(p.x), top + beam * .60, width * .91);
  }
}

function createScenery() {
  const props = [];
  for (let i = 0; i < 55; i++) {
    const point = 90 + i * 92;
    for (const side of [-1, 1]) {
      const seed = i * 2 + (side + 1) / 2;
      props.push({ point, side, lane: side * (1.4 + random(seed) * .36), kind: i % 6 === 2 ? 'house' : 'tree', seed });
      if (i % 2 === 0) props.push({ point: point + 46, lane: side * 1.13, kind: 'candy', seed });
    }
  }
  props.push({ point: 350, kind: 'arch' });
  return props;
}

function createScene(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false });
  const backdrop = sky();
  const props = createScenery();

  function drawRoad(distance, camera) {
    for (let ahead = VIEW; ahead > 0; ahead -= 19) {
      const b = projection(distance, ahead, camera);
      const a = projection(distance, Math.max(0, ahead - 19), camera);
      const tile = Math.floor((distance + ahead) / 48);
      const light = tile % 2 === 0;
      rect(ctx, light ? '#ccdeef' : '#d4e5f2', 0, Math.floor(b.y), WIDTH, Math.ceil(a.y - b.y) + 1);
      const band = (color, left, right) => polygon(ctx, color, [[b.x+b.half*left,b.y],[b.x+b.half*right,b.y],[a.x+a.half*right,a.y+.5],[a.x+a.half*left,a.y+.5]]);
      band(light ? '#e47784' : '#f5f3f0', -1.08, 1.08);
      band(light ? '#7eb9df' : '#82c0e4', -1, 1);
      band(light ? '#91c9e9' : '#87c2e4', -.91, .91);
      band(light ? '#9bd1ec' : '#91c9e9', -.76, -.43);
      band(light ? '#a0d4ed' : '#95c9e7', .2, .49);
      if (tile % 4 < 2) {
        band('#d7ebf45c', -.38, -.365);
        band('#d7ebf45c', .365, .38);
      }
      if (tile % 6 === 1) {
        band('#bde3f19a', -.68, -.54);
        band('#bde3f18c', .57, .71);
      }
    }
    const line = mod(350 - distance, COURSE);
    if (line < VIEW) {
      for (let row = 0; row < 2; row++) {
        const a = projection(distance, line + row * 11, camera);
        const b = projection(distance, line + (row + 1) * 11, camera);
        for (let col = 0; col < 16; col++) {
          const l = col / 8 - 1;
          const r = l + .125;
          polygon(ctx, (row + col) % 2 ? '#435b84' : '#f4f1ec', [[a.x+a.half*l,a.y],[a.x+a.half*r,a.y],[b.x+b.half*r,b.y],[b.x+b.half*l,b.y]]);
        }
      }
    }
  }

  return function render({ distance, player, opponents, boxes, time, idle }) {
    ctx.drawImage(backdrop, 0, 0);
    const camera = idle ? 0 : player.x;
    const field = [{ kind: 'player', ahead: 39, lane: player.x }];
    drawRoad(distance, camera);
    for (const prop of props) {
      const ahead = mod(prop.point - distance, COURSE);
      if (ahead > 12 && ahead < VIEW) field.push({ ...prop, ahead });
    }
    for (const box of boxes) {
      const ahead = box.point - distance;
      if (ahead > 13 && ahead < VIEW && !box.taken) field.push({ ...box, ahead, kind: 'gift' });
    }
    for (const rival of opponents) {
      const ahead = rival.d - player.d + 39;
      if (ahead > 15 && ahead < VIEW) field.push({ kind: 'rival', ahead, lane: rival.x, id: rival.id });
    }
    field.sort((a, b) => b.ahead - a.ahead);
    for (const object of field) {
      const p = projection(distance, object.ahead, camera);
      const x = p.x + p.half * (object.lane ?? 0);
      const s = p.scale;
      if (object.kind === 'tree') pine(ctx, x, p.y, s * (1.3 + random(object.seed + 60) * .9), object.seed % 3 !== 1);
      if (object.kind === 'house') cabin(ctx, x + object.side * s * 10, p.y, s * 1.65, object.seed);
      if (object.kind === 'candy') candy(ctx, x, p.y, s * 1.2);
      if (object.kind === 'arch') arch(ctx, p, time);
      if (object.kind === 'gift') gift(ctx, x, p.y, s * 1.2, time, object.variant);
      if (object.kind === 'rival') drawKart(ctx, x, p.y, s * 1.21, object.id);
      if (object.kind === 'player') {
        if (Math.abs(player.slide) > .28 && player.speed > 90) {
          for (let i = 0; i < 10; i++) {
            rect(ctx, i % 2 ? '#f0f9ffad' : '#8ee9ffac', x + (random(i) - .5) * 55 - player.slide * i * 1.4, p.y + random(i + 73) * 17, 2 + i % 3, 2);
          }
        }
        drawKart(ctx, x, p.y, s * 1.65, 0, player.slide, player.boost > 0);
      }
    }
    for (let i = 0; i < 59; i++) {
      const y = mod(random(i + 730) * HEIGHT + time * (8 + i % 17), HEIGHT);
      const x = mod(random(i + 630) * WIDTH + time * (3 + i % 5), WIDTH);
      const size = i % 7 === 0 ? 2 : 1;
      rect(ctx, i % 3 ? '#eff6ffb0' : '#eff6ff67', Math.floor(x), Math.floor(y), size, size);
    }
  };
}
