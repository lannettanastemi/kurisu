import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import type { Limit, Usage } from '../types'
import { clawdCells, clawdSvg, clawdTerminalRows, type ClawdMode } from './clawd'
import { cells, svg, terminalSize, type Mood } from './sprite'

const BUST = 46
const HEAD = 26

const usage = atom({ plugin: 'kurisu-limits', key: 'usage' } as const, { limits: [] }, {
  shape: 'usage-1',
})
const isHidden = atom({ plugin: 'kurisu-limits', key: 'isHidden' } as const, false)
const nickname = atom({ plugin: 'kurisu-limits', key: 'nickname' } as const, 0)

const LABELS: Record<string, string> = {
  five_hour: '5 часов',
  seven_day: 'Неделя',
  spend_limit: 'Расходы',
}

const LINES: Record<Mood, string[]> = {
  calm: [
    'Лимиты в норме. Не отвлекай, у меня эксперимент.',
    'Всё по плану. Это не значит, что я за тобой присматриваю!',
    'Кофе остывает, а ты всё ещё не закоммитил.',
  ],
  working: ['Хм... Посмотрим, что тут у тебя.', 'Не дыши мне в затылок, я думаю.'],
  busy: [
    'Ты тратишь лимит быстрее, чем Окабэ — мои нервы.',
    'Учёный должен экономить ресурсы. Притормози.',
  ],
  panic: ['Ты что творишь?! Лимит почти кончился!', 'Ещё пара запросов — и всё, конец эксперимента!'],
  out: ['Всё. Лимит исчерпан. Иди выпей кофе, как я.'],
  shy: ['Н-не называй меня так! Я тебе не Кристина и не ассистентка!'],
}

function moodOf(data: Usage, working: boolean, shy: boolean): Mood {
  if (shy) return 'shy'
  const top = Math.max(0, ...data.limits.map(limit => limit.percentUsed))
  if (top >= 100) return 'out'
  if (top >= 85) return 'panic'
  if (working) return 'working'
  if (top >= 60) return 'busy'
  return 'calm'
}

function clawdModeOf(data: Usage, working: boolean): ClawdMode {
  const top = Math.max(0, ...data.limits.map(limit => limit.percentUsed))
  if (top >= 100) return 'out'
  if (top >= 85) return 'panic'
  if (working) return 'working'
  return 'idle'
}

function barColor(percent: number) {
  if (percent >= 85) return '#e5484d'
  if (percent >= 60) return '#f5a524'
  return '#46a758'
}

function bar(percent: number, width: number) {
  const filled = Math.round((Math.min(100, Math.max(0, percent)) / 100) * width)
  return { filled: '█'.repeat(filled), empty: '░'.repeat(width - filled) }
}

const pad = (n: number) => String(n).padStart(2, '0')

function resetText(resetsAt: string | undefined, now: number) {
  if (!resetsAt) return ''
  const at = Date.parse(resetsAt)
  if (Number.isNaN(at)) return ''
  const minutes = Math.max(0, Math.round((at - now) / 60000))
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const rest = minutes % 60
  const left = days > 0 ? `${days} д ${hours} ч` : hours > 0 ? `${hours} ч ${rest} мин` : `${rest} мин`
  const date = new Date(at)
  const clock = `${pad(date.getHours())}:${pad(date.getMinutes())}`
  const day = days > 0 ? ` ${pad(date.getDate())}.${pad(date.getMonth() + 1)}` : ''
  return `сброс в ${clock}${day} · через ${left}`
}

function toUsage(limits: Limit[], contextPercent?: number, costUsd?: number): Usage {
  return {
    limits: limits.map(({ kind, percentUsed, resetsAt }) => ({ kind, percentUsed, resetsAt })),
    contextPercent,
    costUsd,
  }
}

function statusText(data: Usage) {
  const parts = data.limits.map(limit => `${LABELS[limit.kind] ?? limit.kind} ${Math.round(limit.percentUsed)}%`)
  if (parts.length === 0) return undefined
  return `🧪 ${parts.join(' · ')}`
}

let lastWarned = 0

async function store($: EngineInterface, next: Usage) {
  await update($, usage, () => next)
  $.ui.status(statusText(next))
  const top = Math.max(0, ...next.limits.map(limit => limit.percentUsed))
  const level = top >= 100 ? 100 : top >= 85 ? 85 : top >= 60 ? 60 : 0
  if (level > lastWarned) {
    if (level === 60) $.ui.toast('Курису: ты уже потратил больше половины лимита. Я слежу.')
    if (level === 85) $.ui.toast('Курису: лимит почти кончился! Притормози!')
    if (level === 100) $.ui.toast('Курису: всё, лимит исчерпан.')
  }
  lastWarned = level
}

async function refresh($: EngineInterface) {
  const now = await $.session.usage()
  await store($, toUsage(now.rateLimits, now.context.percent, now.cost?.usd))
}

export const register: Register = on => {
  let tick = 0
  let timer: Timer | undefined
  let shyUntil = 0

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'kurisu',
      description: 'Показать или спрятать Курису с лимитами над полем ввода',
    })
    await refresh($)
    $.clock.every(60000, () => {
      void refresh($)
      $.ui.invalidate('ui.render')
    })
    $.ui.toast('El Psy Kongroo.')

    return next(e)
  })

  on('command.run', { command: 'kurisu' }, async $ => {
    const wasHidden = await read($, isHidden)
    await update($, isHidden, () => !wasHidden)

    return { text: wasHidden ? 'Курису на месте.' : 'Курису ушла пить кофе. /kurisu — позвать обратно.' }
  })

  on('session.measure', async ($, e, next) => {
    await store($, toUsage(e.rateLimits, e.context.percent, e.cost?.usd))

    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    if (/кристин|christina|ассистентк|assistant/i.test(e.text ?? '')) {
      shyUntil = (await $.clock.now()) + 8000
      await update($, nickname, n => (n ?? 0) + 1)
      $.clock.after(8100, () => $.ui.invalidate('ui.render'))
    }

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || (await read($, isHidden))) return next(e)

    const data = await read($, usage)
    await read($, nickname)
    const now = await $.clock.now()
    const mood = moodOf(data, e.props.isWorking, now < shyUntil)
    const lines = LINES[mood]
    const line = lines[Math.floor(now / 60000) % lines.length] ?? ''
    const columns = e.props.bodyColumns
    const width = Math.max(6, Math.min(20, columns - 58))

    const clawdMode = clawdModeOf(data, e.props.isWorking)
    const surface = e.surface
    const requestId = e.requestId
    let sprite
    let clawd
    if (surface === 'terminal') {
      timer?.cancel()
      timer = undefined
      const size = terminalSize(HEAD)
      const hasKurisu = e.props.maxRows >= size.rows && columns >= 90
      const laneColumns = Math.max(24, Math.min(90, columns - (hasKurisu ? size.columns + 4 : 2)))
      const { Raster } = $.ui.resolve({ ...e, surface })
      if (hasKurisu) {
        sprite = <Raster key="sprite" columns={size.columns} rows={size.rows} cells={cells(mood, tick, HEAD)} />
      }
      clawd = <Raster key="clawd" columns={laneColumns} rows={clawdTerminalRows()} cells={clawdCells(clawdMode, tick, laneColumns)} />
      timer = $.clock.every(140, () => {
        tick += 1
        const blits = [$.ui.blit({ requestId, key: 'clawd', cells: clawdCells(clawdMode, tick, laneColumns) })]
        if (hasKurisu) blits.push($.ui.blit({ requestId, key: 'sprite', cells: cells(mood, tick, HEAD) }))
        void Promise.all(blits).then(results => {
          if (results.some(result => 'deny' in result && result.deny)) {
            timer?.cancel()
            timer = undefined
          }
        })
      })
    } else {
      const { Svg } = $.ui.resolve({ ...e, surface })
      sprite = <Svg source={svg(mood, 2, BUST)} alt={`Курису Макисе: ${line}`} width={80} height={100} isInteractive />
      clawd = <Svg source={clawdSvg(clawdMode)} alt="Пиксельный Клод занимается своими делами" isInteractive />
    }

    const { Box, Text } = $.ui.resolve(e)
    const limitRows = data.limits.length === 0
      ? [<Text dimColor>Лимиты появятся после следующего ответа Claude (только на подписке).</Text>]
      : data.limits.map(limit => {
          const parts = bar(limit.percentUsed, width)
          return (
            <Text mono>
              <Text bold>{(LABELS[limit.kind] ?? limit.kind).padEnd(9)}</Text>
              <Text color={barColor(limit.percentUsed)}>{parts.filled}</Text>
              <Text dimColor>{parts.empty}</Text>
              <Text bold>{` ${String(Math.round(limit.percentUsed)).padStart(3)}%`}</Text>
              <Text dimColor>{`  ${resetText(limit.resetsAt, now)}`}</Text>
            </Text>
          )
        })

    const context = data.contextPercent
    const extras = [
      context !== undefined ? `контекст ${context}%` : '',
      data.costUsd !== undefined && data.costUsd > 0 ? `сессия $${data.costUsd.toFixed(2)}` : '',
    ].filter(Boolean)

    return (
      <Box flexDirection="row" alignItems="center" gap={2}>
        {sprite}
        <Box flexDirection="column" flexGrow={1} flexShrink={1}>
          <Text italic color="#e2665a" wrap="truncate-end">«{line}»</Text>
          {limitRows}
          {extras.length > 0 && <Text dimColor>{extras.join(' · ')}</Text>}
          {clawd}
        </Box>
      </Box>
    )
  })
}
