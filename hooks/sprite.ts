export type Mood = 'calm' | 'working' | 'busy' | 'panic' | 'out' | 'shy'

type Point = [number, number]
type Shape =
  | { poly: Point[] }
  | { ellipse: [number, number, number, number] }
  | { rect: [number, number, number, number] }

type Part = {
  name: string
  color: number
  shade: number
  light?: number
  isShaded?: boolean
  shapes: Shape[]
}

type Pixels = (number | undefined)[][]

export const WIDTH = 40
export const HEIGHT = 72
const WAIST = 40

const OUTLINE = 0x2a1a22
const SKIN = { color: 0xfae0cf, shade: 0xe9b9a3 }
const HAIR = { color: 0xb83a36, shade: 0x82242a, light: 0xe2665a }
const COAT = { color: 0xeeedf5, shade: 0xbfbccd }
const SHIRT = { color: 0xf7f6fa, shade: 0xd2cfdf }

const mirror = (points: Point[]): Point[] => points.map(([x, y]) => [WIDTH - x, y])

const HAIR_BACK: Point[] = [
  [13, 6], [27, 6], [30, 12], [30.6, 24], [31.2, 36], [32, 46], [30.5, 48], [29.5, 46.5],
  [28.5, 49.5], [27, 46], [13, 46], [11.5, 49.5], [10.5, 46.5], [9.5, 48], [8, 46],
  [8.8, 36], [9.4, 24], [10, 12],
]
const BANGS: Point[] = [
  [12, 13], [11, 8], [14, 5], [20, 3.5], [26, 5], [29, 8], [28, 13], [28, 19],
  [26.5, 15], [25.5, 18], [24, 12.5], [22.5, 16], [21, 12], [20, 15], [18.5, 11.5],
  [17, 16], [15.5, 12.5], [14, 17], [13, 14.5], [12, 20],
]
const LOCK: Point[] = [[11.5, 11], [14.5, 13], [14.2, 22], [13.5, 30], [11.5, 34], [10.5, 24]]
const COAT_PANEL: Point[] = [
  [12.6, 25], [16, 25], [15.6, 32], [15.2, 42], [15.6, 51], [9.8, 51.6], [9.4, 44], [9.8, 34], [10.6, 27.5],
]
const LEG: Point[] = [[14, 46], [19.6, 46], [18.8, 58], [18.6, 64], [15.4, 64], [15, 58]]
const BOOT: Point[] = [[15, 63], [19, 63], [19, 68.5], [20.2, 70], [13.6, 70], [14.4, 66]]
const IDLE_SLEEVE: Point[] = [[10.8, 25.4], [13.6, 26.4], [13.2, 36], [12.8, 43.6], [9.4, 43.6], [8.4, 36], [9.2, 27.6]]

type Pose = 'idle' | 'crossed' | 'mug'

function arms(pose: Pose): Part[] {
  const sleeve = (shapes: Shape[]): Part => ({ name: 'sleeve', ...COAT, isShaded: true, shapes })
  const hands = (shapes: Shape[]): Part => ({ name: 'hand', ...SKIN, shapes })
  if (pose === 'crossed') {
    return [
      sleeve([{ poly: [[29.8, 25.5], [26.2, 26], [26, 29.5], [13, 30], [12.6, 33.2], [28.5, 34], [31, 32]] }]),
      hands([{ ellipse: [12.6, 31.5, 1.6, 1.5] }]),
      sleeve([{ poly: [[10.2, 25.5], [13.8, 26], [14.2, 31.2], [27, 31.5], [27.2, 35.6], [12, 35.8], [9.2, 33]] }]),
      hands([{ ellipse: [27.6, 33.4, 1.6, 1.6] }]),
    ]
  }
  if (pose === 'mug') {
    return [
      sleeve([{ poly: IDLE_SLEEVE }]),
      hands([{ ellipse: [11.2, 45.4, 1.7, 1.6] }]),
      sleeve([{ poly: [[26.2, 26], [29.8, 25.5], [31.2, 33], [30.8, 35.5], [27.5, 35.5], [26.2, 31]] }]),
      sleeve([{ poly: [[27.5, 35.5], [30.8, 35.5], [31.6, 30], [31.2, 26.5], [28.6, 26.5], [28.4, 31]] }]),
      {
        name: 'mug',
        color: 0xfafafa,
        shade: 0xc9c9d2,
        isShaded: true,
        shapes: [{ rect: [29, 19.5, 34, 26] }, { rect: [34, 21, 35.4, 22] }, { rect: [34.8, 21, 35.8, 25] }, { rect: [34, 24, 35.4, 25] }],
      },
      { name: 'coffee', color: 0x5a3426, shade: 0x5a3426, shapes: [{ rect: [29.4, 19.5, 33.6, 20.4] }] },
      hands([{ ellipse: [29.6, 25, 1.7, 1.6] }]),
    ]
  }
  return [
    sleeve([{ poly: IDLE_SLEEVE }]),
    hands([{ ellipse: [11.2, 45.4, 1.7, 1.6] }]),
    sleeve([{ poly: mirror(IDLE_SLEEVE) }]),
    hands([{ ellipse: [28.8, 45.4, 1.7, 1.6] }]),
  ]
}

function parts(pose: Pose): Part[] {
  return [
    { name: 'hairBack', ...HAIR, isShaded: true, shapes: [{ poly: HAIR_BACK }] },
    { name: 'leg', color: 0x3d3346, shade: 0x2a2231, light: 0x5a4d66, isShaded: true, shapes: [{ poly: LEG }, { poly: mirror(LEG) }] },
    { name: 'boot', color: 0x4a3530, shade: 0x2a1c18, isShaded: true, shapes: [{ poly: BOOT }, { poly: mirror(BOOT) }] },
    {
      name: 'shorts',
      color: 0x2b2530,
      shade: 0x1b161f,
      isShaded: true,
      shapes: [{ poly: [[14.5, 40.5], [25.5, 40.5], [26.4, 46.4], [21, 46.8], [20, 44.5], [19, 46.8], [13.6, 46.4]] }],
    },
    { name: 'neck', ...SKIN, shapes: [{ rect: [18, 20, 22, 25] }] },
    { name: 'shirt', ...SHIRT, isShaded: true, shapes: [{ poly: [[15, 24], [25, 24], [26, 30], [24.8, 37.5], [25.4, 40.5], [14.6, 40.5], [15.2, 37.5], [14, 30]] }] },
    { name: 'belt', color: 0x6a4632, shade: 0x4a2e20, shapes: [{ rect: [14.5, 39.4, 25.5, 40.6] }] },
    { name: 'collar', color: 0x4a4f9a, shade: 0x343874, shapes: [{ poly: [[16.6, 23.6], [23.4, 23.6], [22.4, 25.4], [17.6, 25.4]] }] },
    {
      name: 'tie',
      color: 0xc8202a,
      shade: 0x8f1820,
      isShaded: true,
      shapes: [{ poly: [[19, 25.2], [21, 25.2], [21.6, 28], [21.6, 35], [20, 37.2], [18.4, 35], [18.4, 28]] }],
    },
    { name: 'coat', ...COAT, isShaded: true, shapes: [{ poly: COAT_PANEL }, { poly: mirror(COAT_PANEL) }] },
    { name: 'head', ...SKIN, shapes: [{ ellipse: [20, 14.6, 6.6, 7.4] }] },
    { name: 'bangs', ...HAIR, isShaded: true, shapes: [{ poly: BANGS }] },
    { name: 'lock', ...HAIR, isShaded: true, shapes: [{ poly: LOCK }, { poly: mirror(LOCK) }] },
    ...arms(pose),
  ]
}

function inside(shape: Shape, x: number, y: number): boolean {
  if ('rect' in shape) {
    const [x0, y0, x1, y1] = shape.rect
    return x >= x0 && x < x1 && y >= y0 && y < y1
  }
  if ('ellipse' in shape) {
    const [cx, cy, rx, ry] = shape.ellipse
    return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1
  }
  const points = shape.poly
  let isIn = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i] ?? [0, 0]
    const [xj, yj] = points[j] ?? [0, 0]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) isIn = !isIn
  }
  return isIn
}

type Face = { eyes: [string, string, string]; mouth: string[]; blush: number }

const FACES: Record<Mood, Face> = {
  calm: { eyes: ['LLL', 'WEE', 'EeE'], mouth: ['GG'], blush: 0 },
  working: { eyes: ['LLL', 'WEE', 'EeE'], mouth: ['..'], blush: 0 },
  busy: { eyes: ['LLL', 'WEE', 'EeE'], mouth: ['GG'], blush: 0 },
  panic: { eyes: ['LLL', 'WEW', 'WWW'], mouth: ['GG', 'GG'], blush: 1 },
  out: { eyes: ['SSS', 'SSS', 'LLL'], mouth: ['GG'], blush: 0 },
  shy: { eyes: ['LLL', 'EEW', 'eEW'], mouth: ['G.'], blush: 2 },
}

const STAMP: Record<string, number | undefined> = {
  L: 0x3a2228,
  W: 0xffffff,
  E: 0x6b5bb0,
  e: 0xb3a6ec,
  S: SKIN.color,
  G: 0xb0505a,
  P: 0xf29a9a,
  d: 0x7ec8f0,
}

const POSES: Record<Mood, Pose> = {
  calm: 'mug',
  working: 'crossed',
  busy: 'crossed',
  panic: 'idle',
  out: 'idle',
  shy: 'crossed',
}

const cache = new Map<string, Pixels>()

export function frame(mood: Mood, isBlinking = false): Pixels {
  const id = `${mood}:${isBlinking}`
  const hit = cache.get(id)
  if (hit) return hit

  const list = parts(POSES[mood])
  const owner: number[][] = []
  for (let y = 0; y < HEIGHT; y++) {
    const row: number[] = []
    for (let x = 0; x < WIDTH; x++) {
      let found = -1
      list.forEach((part, i) => {
        if (part.shapes.some(shape => inside(shape, x + 0.5, y + 0.5))) found = i
      })
      row.push(found)
    }
    owner.push(row)
  }
  const at = (x: number, y: number) => owner[y]?.[x] ?? -1

  const pixels: Pixels = owner.map((row, y) =>
    row.map((i, x) => {
      const neighbours = [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)]
      if (i < 0) return neighbours.some(n => n >= 0) ? OUTLINE : undefined
      const part = list[i]
      if (!part) return undefined
      const front = neighbours.find(n => n > i && list[n]?.name !== part.name)
      if (front !== undefined && part.name !== 'head' && list[front]?.name !== 'hand') return part.shade
      const isRightEdge = at(x + 1, y) !== i || at(x + 2, y) !== i
      if (part.isShaded && isRightEdge) return part.shade
      const ring = ((x + 0.5 - 20) / 7.6) ** 2 + ((y + 0.5 - 11) / 6) ** 2
      if (part.light && part.name === 'bangs' && y < 10 && ring > 0.5 && ring < 0.72) return part.light
      const isLegShine = part.name === 'leg' && at(x - 1, y) === i && at(x - 2, y) !== i
      if (part.light && isLegShine && y > 47 && y < 62) return part.light
      return part.color
    }),
  )

  const face = FACES[mood]
  const stamp = (x: number, y: number, ch: string) => {
    const color = STAMP[ch]
    const row = pixels[y]
    if (color !== undefined && row && x >= 0 && x < WIDTH) row[x] = color
  }
  const eyes: [string, string, string] = isBlinking && mood !== 'out' ? ['SSS', 'SSS', 'LLL'] : face.eyes
  eyes.forEach((line, dy) => {
    ;[...line].forEach((ch, dx) => {
      stamp(15 + dx, 15 + dy, ch)
      if (dy === 0 && ch === 'L') {
        stamp(14, 15, 'L')
        stamp(25, 15, 'L')
      }
      const mirrored = mood === 'shy' ? ch : line[line.length - 1 - dx] ?? ch
      stamp(22 + dx, 15 + dy, mirrored)
    })
  })
  face.mouth.forEach((line, dy) => [...line].forEach((ch, dx) => stamp(19 + dx, 20 + dy, ch)))
  for (let i = 0; i < face.blush; i++) {
    stamp(15 + i, 18, 'P')
    stamp(24 - i, 18, 'P')
  }
  if (mood === 'busy' || mood === 'panic') {
    stamp(29, 9, 'd')
    stamp(29, 10, 'd')
    stamp(30, 10, 'd')
    stamp(29, 11, 'd')
  }

  cache.set(id, pixels)
  return pixels
}

const hex = (color: number) => '#' + color.toString(16).padStart(6, '0')

function rects(pixels: Pixels, from: number, to: number): string {
  let out = ''
  for (let y = from; y < to; y++) {
    const row = pixels[y] ?? []
    let x = 0
    while (x < WIDTH) {
      const color = row[x]
      let end = x + 1
      while (end < WIDTH && row[end] === color) end++
      if (color !== undefined) out += `<rect x="${x}" y="${y}" width="${end - x}" height="1.1" fill="${hex(color)}"/>`
      x = end
    }
  }
  return out
}

function eyeRects(pixels: Pixels): string {
  let out = ''
  for (let y = 15; y <= 17; y++) {
    for (const x of [15, 16, 17, 22, 23, 24]) {
      const color = pixels[y]?.[x]
      if (color !== undefined) out += `<rect x="${x}" y="${y}" width="1" height="1" fill="${hex(color)}"/>`
    }
  }
  return out
}

const MOTION: Record<Mood, { name: string; seconds: number; height: number }> = {
  calm: { name: 'breathe', seconds: 2.6, height: 1 },
  working: { name: 'hop', seconds: 0.8, height: 3 },
  busy: { name: 'tap', seconds: 0.5, height: 1 },
  panic: { name: 'shake', seconds: 0.16, height: 0 },
  out: { name: 'breathe', seconds: 4.5, height: 1 },
  shy: { name: 'sway', seconds: 1.8, height: 0 },
}

export function svg(mood: Mood, scale = 5): string {
  const pixels = frame(mood)
  const closed = frame(mood, true)
  const motion = MOTION[mood]
  const isBreathing = motion.name === 'breathe'
  const steam = mood === 'calm'
    ? '<g class="steam"><rect x="30" y="17" width="1" height="1" fill="#e3e3ea"/><rect x="31" y="16" width="1" height="1" fill="#e3e3ea"/><rect x="30" y="15" width="1" height="1" fill="#efeff4"/></g><g class="steam s2"><rect x="32" y="17" width="1" height="1" fill="#e3e3ea"/><rect x="32" y="15" width="1" height="1" fill="#efeff4"/></g>'
    : ''
  const zzz = mood === 'out'
    ? '<text class="z" x="29" y="8" font-size="5" font-family="monospace" fill="#9a8fc9">z</text><text class="z z2" x="32" y="4" font-size="4" font-family="monospace" fill="#9a8fc9">z</text>'
    : ''
  const h = HEIGHT + 6
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -4 ${WIDTH} ${h}" width="${WIDTH * scale}" height="${h * scale}" shape-rendering="crispEdges">
<style>
.all{animation:${motion.name} ${motion.seconds}s ease-in-out infinite;transform-origin:50% 100%;transform-box:fill-box}
.upper{animation:chest ${motion.seconds}s steps(1) infinite}
.lids{opacity:0;animation:blink 4.4s steps(1) infinite}
.steam{opacity:0;animation:steam 2.4s linear infinite}
.s2{animation-delay:1.2s}
.z{opacity:0;animation:steam 3s linear infinite}
.z2{animation-delay:1.5s}
@keyframes breathe{0%,100%{transform:translateY(0)}}
@keyframes chest{0%,49%{transform:translateY(0)}50%,100%{transform:translateY(${isBreathing ? 1 : 0}px)}}
@keyframes hop{0%,100%{transform:translateY(0) scaleY(1)}15%{transform:translateY(0) scaleY(.95)}50%{transform:translateY(-${motion.height}px) scaleY(1.02)}85%{transform:translateY(0) scaleY(.97)}}
@keyframes tap{0%,100%{transform:translateY(0)}50%{transform:translateY(-1px)}}
@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-.6px)}75%{transform:translateX(.6px)}}
@keyframes sway{0%,100%{transform:rotate(-1.5deg)}50%{transform:rotate(1.5deg)}}
@keyframes blink{0%,93%{opacity:0}94%,98%{opacity:1}99%,100%{opacity:0}}
@keyframes steam{0%{opacity:0;transform:translateY(1px)}30%{opacity:.9}100%{opacity:0;transform:translateY(-4px)}}
</style>
<ellipse cx="${WIDTH / 2}" cy="${HEIGHT - 1.2}" rx="9" ry="1.3" fill="#000" opacity=".18"/>
<g class="all"><g>${rects(pixels, WAIST, HEIGHT)}</g><g class="upper">${rects(pixels, 0, WAIST)}<g class="lids">${eyeRects(closed)}</g></g>${steam}${zzz}</g>
</svg>`
}

const DEFAULT_COLOR = 0x01000000

export function terminalSize() {
  return { columns: WIDTH, rows: Math.ceil((HEIGHT + 2) / 2) }
}

export function cells(mood: Mood, tick: number): string {
  const pixels = frame(mood, tick % 32 === 31)
  const { columns, rows: lines } = terminalSize()
  const hop = mood === 'working' ? [0, 1, 2, 2, 1, 0][tick % 6] ?? 0 : 0
  const breathe = (mood === 'calm' || mood === 'out') && Math.floor(tick / 9) % 2 === 1 ? 1 : 0
  const jitter = mood === 'panic' ? tick % 2 : 0
  const pixel = (x: number, y: number): number => {
    let sy = y - 2 + hop
    if (breathe && sy < WAIST) sy -= 1
    return pixels[sy]?.[x - jitter] ?? DEFAULT_COLOR
  }
  const words = new Uint32Array(columns * lines * 3)
  for (let line = 0; line < lines; line++) {
    for (let x = 0; x < columns; x++) {
      const i = (line * columns + x) * 3
      const top = pixel(x, line * 2)
      const bottom = pixel(x, line * 2 + 1)
      if (top === DEFAULT_COLOR && bottom === DEFAULT_COLOR) {
        words.set([0x20, DEFAULT_COLOR, DEFAULT_COLOR], i)
      } else if (top === DEFAULT_COLOR) {
        words.set([0x2584, bottom, DEFAULT_COLOR], i)
      } else {
        words.set([0x2580, top, bottom], i)
      }
    }
  }
  const bytes = new Uint8Array(words.buffer)
  let binary = ''
  bytes.forEach(byte => (binary += String.fromCharCode(byte)))
  return btoa(binary)
}
