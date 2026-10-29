export type ClawdMode = 'idle' | 'working' | 'panic' | 'out'

const ORANGE = 0xd97757
const DARK = 0x1f1410
const PALETTE: Record<string, number | undefined> = {
  O: ORANGE,
  o: 0xb85f42,
  K: DARK,
  L: 0x6c6f7a,
  l: 0x9aa0ad,
  s: 0x9fd8ff,
  H: 0xe5484d,
  d: 0x7ec8f0,
}

const BODY = [
  '..OOOOOOOOOOO..',
  '..OOOOOOOOOOO..',
  '..OOKOOOOOKOO..',
  'OOOOKOOOOOKOOOO',
  'OOOOOOOOOOOOOOO',
  '..OOOOOOOOOOO..',
  '..ooooooooooo..',
]
const CLOSED = [
  '..OOOOOOOOOOO..',
  '..OOOOOOOOOOO..',
  '..OOOOOOOOOOO..',
  'OOOOKOOOOOKOOOO',
  'OOOOOOOOOOOOOOO',
  '..OOOOOOOOOOO..',
  '..ooooooooooo..',
]
const TYPING = [
  '..OOOOOOOOOOO..',
  '..OOOOOOOOOOO..',
  '..OOKOOOOOKOO..',
  '..OOKOOOOOKOO..',
  'OOOOOOOOOOOOOOO',
  'O.OOOOOOOOOOO.O',
  '..ooooooooooo..',
]
const LYING = [
  '...............',
  '...............',
  '..OOOOOOOOOOO..',
  '.OOOOOOOOOOOOO.',
  'OOOOKKOOOKKOOOO',
  'OOOOOOOOOOOOOOO',
  '.ooooooooooooo.',
]
const LEGS_A = ['..O.O.....O.O..', '..O.O.....O.O..']
const LEGS_B = ['...O.O...O.O...', '...O.O...O.O...']
const LEGS_SIT = ['..OO.......OO..', '...............']
const LAPTOP = ['.LLLLLLL.', '.LsssssL.', '.LsssssL.', '.LLLLLLL.', 'lllllllll']
const HEART = ['.H.H.', 'HHHHH', '.HHH.', '..H..']

export const LANE_WIDTH = 200
export const LANE_HEIGHT = 18
const GROUND = LANE_HEIGHT - 1

const hex = (color: number) => '#' + color.toString(16).padStart(6, '0')

function art(rows: string[], left = 0, top = 0): string {
  let out = ''
  rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const ch = row[x] ?? '.'
      let end = x + 1
      while (end < row.length && row[end] === ch) end++
      const color = PALETTE[ch]
      if (color !== undefined) out += `<rect x="${left + x}" y="${top + y}" width="${end - x}" height="1.05" fill="${hex(color)}"/>`
      x = end
    }
  })
  return out
}

const TOP = GROUND - 9

function walker(legsSeconds: number): string {
  return `<g class="c-walk"><g class="c-la">${art(LEGS_A, 0, TOP + 7)}</g><g class="c-lb">${art(LEGS_B, 0, TOP + 7)}</g></g><g class="c-sit">${art(LEGS_SIT, 0, TOP + 7)}</g><g class="c-open">${art(BODY, 0, TOP)}</g><g class="c-shut">${art(CLOSED, 0, TOP)}</g>
<style>.c-la{animation:ck-la ${legsSeconds}s steps(1) infinite}.c-lb{animation:ck-lb ${legsSeconds}s steps(1) infinite}@keyframes ck-la{0%,49%{opacity:1}50%,100%{opacity:0}}@keyframes ck-lb{0%,49%{opacity:0}50%,100%{opacity:1}}.c-shut{opacity:0;animation:ck-blink 3.7s steps(1) infinite}@keyframes ck-blink{0%,92%{opacity:0}93%,97%{opacity:1}98%,100%{opacity:0}}</style>`
}

function idle(): string {
  const cycle = 22
  return `<style>
.c-pos{animation:ck-pos ${cycle}s linear infinite}
.c-dir{transform-box:fill-box;transform-origin:center;animation:ck-dir ${cycle}s steps(1) infinite}
.c-hop{animation:ck-hop ${cycle}s ease-in-out infinite}
.c-walk{animation:ck-walkvis ${cycle}s steps(1) infinite}
.c-sit{opacity:0;animation:ck-sitvis ${cycle}s steps(1) infinite}
.c-heart{opacity:0;animation:ck-heart ${cycle}s ease-out infinite}
@keyframes ck-pos{0%{transform:translateX(4px)}28%{transform:translateX(${LANE_WIDTH - 22}px)}40%{transform:translateX(${LANE_WIDTH - 22}px)}66%{transform:translateX(70px)}100%{transform:translateX(70px)}}
@keyframes ck-dir{0%{transform:scaleX(1)}38%{transform:scaleX(-1)}66%{transform:scaleX(1)}}
@keyframes ck-hop{0%,29%{transform:translateY(0)}31%{transform:translateY(-6px)}33%{transform:translateY(0)}35%{transform:translateY(-8px)}37%,82%{transform:translateY(0)}84%{transform:translateY(-4px)}86%,100%{transform:translateY(0)}}
@keyframes ck-walkvis{0%,66%{opacity:1}67%,100%{opacity:0}}
@keyframes ck-sitvis{0%,66%{opacity:0}67%,100%{opacity:1}}
@keyframes ck-heart{0%,74%{opacity:0;transform:translateY(0)}76%{opacity:1;transform:translateY(0)}86%{opacity:0;transform:translateY(-6px)}100%{opacity:0}}
</style>
<g class="c-pos"><g class="c-hop"><g class="c-dir">${walker(0.3)}</g><g class="c-heart">${art(HEART, 5, TOP - 6)}</g></g></g>`
}

function working(): string {
  return `<style>
.c-pos{transform:translateX(88px)}
.c-typing{animation:ck-type .24s steps(1) infinite}
.c-rest{animation:ck-type .24s steps(1) infinite reverse}
@keyframes ck-type{0%,49%{opacity:1}50%,100%{opacity:0}}
.c-dots rect{animation:ck-dot 1.2s steps(1) infinite}
.c-dots rect:nth-child(2){animation-delay:.2s}.c-dots rect:nth-child(3){animation-delay:.4s}
@keyframes ck-dot{0%,40%{opacity:1}41%,100%{opacity:.15}}
.c-glow{animation:ck-glow 1.6s ease-in-out infinite}
@keyframes ck-glow{0%,100%{opacity:.6}50%{opacity:1}}
.c-hop{animation:ck-hop 7s ease-in-out infinite}
@keyframes ck-hop{0%,88%{transform:translateY(0)}92%{transform:translateY(-5px)}96%,100%{transform:translateY(0)}}
</style>
<g class="c-pos"><g class="c-hop">${art(LEGS_SIT, 0, TOP + 7)}<g class="c-typing">${art(TYPING, 0, TOP)}</g><g class="c-rest" opacity="0">${art(BODY, 0, TOP)}</g></g>
<g class="c-glow">${art(LAPTOP, 16, GROUND - 5)}</g>
<g class="c-dots"><rect x="18" y="${TOP - 3}" width="1" height="1" fill="#9a8fc9"/><rect x="20" y="${TOP - 3}" width="1" height="1" fill="#9a8fc9"/><rect x="22" y="${TOP - 3}" width="1" height="1" fill="#9a8fc9"/></g></g>`
}

function panic(): string {
  const cycle = 2.6
  return `<style>
.c-pos{animation:ck-pos ${cycle}s linear infinite}
.c-dir{transform-box:fill-box;transform-origin:center;animation:ck-dir ${cycle}s steps(1) infinite}
.c-hop{animation:ck-hop .3s ease-in-out infinite}
.c-sit{opacity:0}
@keyframes ck-pos{0%{transform:translateX(4px)}50%{transform:translateX(${LANE_WIDTH - 22}px)}100%{transform:translateX(4px)}}
@keyframes ck-dir{0%{transform:scaleX(1)}50%{transform:scaleX(-1)}}
@keyframes ck-hop{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
</style>
<g class="c-pos"><g class="c-hop"><g class="c-dir">${walker(0.14)}</g>${art(['d', 'd'], 13, TOP - 2)}</g></g>`
}

function out(): string {
  return `<style>
.c-z{opacity:0;animation:ck-z 3s linear infinite}.c-z2{animation-delay:1.5s}
@keyframes ck-z{0%{opacity:0;transform:translate(0,0)}30%{opacity:1}100%{opacity:0;transform:translate(4px,-8px)}}
.c-breath{animation:ck-br 3s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}
@keyframes ck-br{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.08)}}
</style>
<g transform="translate(90 0)"><g class="c-breath">${art(LYING, 0, GROUND - 7)}</g>
<text class="c-z" x="14" y="${TOP}" font-size="6" font-family="monospace" fill="#9a8fc9">z</text><text class="c-z c-z2" x="17" y="${TOP - 3}" font-size="5" font-family="monospace" fill="#9a8fc9">z</text></g>`
}

export function clawdSvg(mode: ClawdMode, scale = 3): string {
  const scene = mode === 'working' ? working() : mode === 'panic' ? panic() : mode === 'out' ? out() : idle()
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LANE_WIDTH} ${LANE_HEIGHT}" width="${LANE_WIDTH * scale}" height="${LANE_HEIGHT * scale}" shape-rendering="crispEdges">
<rect x="0" y="${GROUND}" width="${LANE_WIDTH}" height="1" fill="#8a7f99" opacity=".35"/>
${scene}
</svg>`
}

const DEFAULT_COLOR = 0x01000000

function stamp(grid: number[][], rows: string[], left: number, top: number, isFlipped = false) {
  rows.forEach((row, y) => {
    const line = isFlipped ? [...row].reverse().join('') : row
    ;[...line].forEach((ch, x) => {
      const color = PALETTE[ch]
      const target = grid[top + y]
      if (color !== undefined && target && left + x >= 0 && left + x < target.length) target[left + x] = color
    })
  })
}

export function clawdTerminalRows() {
  return Math.ceil(LANE_HEIGHT / 2)
}

export function clawdCells(mode: ClawdMode, tick: number, columns: number): string {
  const grid: number[][] = Array.from({ length: LANE_HEIGHT }, () => Array.from({ length: columns }, () => DEFAULT_COLOR))
  const span = Math.max(1, columns - 16)
  const legs = tick % 2 === 0 ? LEGS_A : LEGS_B
  const isBlinking = tick % 27 === 26
  if (mode === 'out') {
    stamp(grid, LYING, Math.floor(columns / 2) - 7, GROUND - 7)
  } else if (mode === 'working') {
    const x = Math.floor(columns / 2) - 12
    const hop = tick % 40 >= 36 ? 2 : 0
    stamp(grid, LEGS_SIT, x, TOP + 7 - hop)
    stamp(grid, tick % 2 === 0 ? TYPING : BODY, x, TOP - hop)
    stamp(grid, LAPTOP, x + 16, GROUND - 5)
  } else {
    const speed = mode === 'panic' ? 3 : 1
    const step = (tick * speed) % (span * 2)
    const isBack = step >= span
    const x = isBack ? span * 2 - step : step
    const hop = mode === 'panic' ? tick % 2 : [0, 0, 0, 0, 2, 4, 5, 4, 2][tick % 60] ?? 0
    stamp(grid, legs, x, TOP + 7 - hop, isBack)
    stamp(grid, isBlinking ? CLOSED : BODY, x, TOP - hop, isBack)
  }
  const lines = clawdTerminalRows()
  const words = new Uint32Array(columns * lines * 3)
  for (let line = 0; line < lines; line++) {
    for (let x = 0; x < columns; x++) {
      const i = (line * columns + x) * 3
      const top = grid[line * 2]?.[x] ?? DEFAULT_COLOR
      const bottom = grid[line * 2 + 1]?.[x] ?? DEFAULT_COLOR
      if (top === DEFAULT_COLOR && bottom === DEFAULT_COLOR) words.set([0x20, DEFAULT_COLOR, DEFAULT_COLOR], i)
      else if (top === DEFAULT_COLOR) words.set([0x2584, bottom, DEFAULT_COLOR], i)
      else words.set([0x2580, top, bottom], i)
    }
  }
  const bytes = new Uint8Array(words.buffer)
  let binary = ''
  bytes.forEach(byte => (binary += String.fromCharCode(byte)))
  return btoa(binary)
}
