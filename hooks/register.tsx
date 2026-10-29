import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import type { Limit, Usage } from '../types'
import { cells, svg, terminalSize, type Mood } from './sprite'

const PANE = 'kurisu'
const TITLE = 'Курису · лимиты'

const usage = atom({ plugin: 'kurisu-limits', key: 'usage' } as const, { limits: [] }, {
  shape: 'usage-1',
})
const isWorking = atom({ plugin: 'kurisu-limits', key: 'isWorking' } as const, false)
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

function barColor(percent: number) {
  if (percent >= 85) return '#e5484d'
  if (percent >= 60) return '#f5a524'
  return '#46a758'
}

function bar(percent: number, width: number) {
  const filled = Math.round((Math.min(100, Math.max(0, percent)) / 100) * width)
  return { filled: '█'.repeat(filled), empty: '░'.repeat(width - filled) }
}

function untilReset(resetsAt: string | undefined, now: number) {
  if (!resetsAt) return ''
  const minutes = Math.max(0, Math.round((Date.parse(resetsAt) - now) / 60000))
  if (Number.isNaN(minutes)) return ''
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const rest = minutes % 60
  if (days > 0) return `сброс через ${days} д ${hours} ч`
  if (hours > 0) return `сброс через ${hours} ч ${rest} мин`
  return `сброс через ${rest} мин`
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

export const register: Register = on => {
  let tick = 0
  let timer: Timer | undefined
  let shyUntil = 0

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'kurisu',
      description: 'Открыть панель Курису с лимитами Claude',
    })
    const now = await $.session.usage()
    await store($, toUsage(now.rateLimits, now.context.percent, now.cost?.usd))
    $.clock.every(60000, () => $.ui.invalidate('ui.render'))
    void $.ui.open({ id: PANE, title: TITLE })
    $.ui.toast('El Psy Kongroo.')

    return next(e)
  })

  on('command.run', { command: 'kurisu' }, async $ => {
    await $.ui.open({ id: PANE, title: TITLE })

    return { text: 'Курису на месте.' }
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
    await update($, isWorking, () => true)

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    await update($, isWorking, () => false)

    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const data = await read($, usage)
    const working = await read($, isWorking)
    await read($, nickname)
    const now = await $.clock.now()
    const mood = moodOf(data, working, now < shyUntil)
    const lines = LINES[mood]
    const line = lines[Math.floor(now / 60000) % lines.length]
    const width = Math.max(8, Math.min(24, (e.props.bodyColumns ?? 30) - 16))

    const surface = e.surface
    let sprite
    if (surface === 'terminal') {
      const { Raster } = $.ui.resolve({ ...e, surface })
      const size = terminalSize()
      sprite = <Raster key="sprite" columns={size.columns} rows={size.rows} cells={cells(mood, tick)} />
      timer?.cancel()
      timer = $.clock.every(140, () => {
        tick += 1
        void $.ui.blit({ requestId: PANE, key: 'sprite', cells: cells(mood, tick) }).then(result => {
          if ('deny' in result && result.deny) {
            timer?.cancel()
            timer = undefined
          }
        })
      })
    } else {
      const { Svg } = $.ui.resolve({ ...e, surface })
      sprite = <Svg source={svg(mood)} alt={`Курису Макисе: ${line}`} isInteractive />
    }

    const { Box, Text } = $.ui.resolve(e)
    const rows = data.limits.length === 0
      ? [<Text dimColor>Данных о лимитах пока нет: они появятся после первого ответа (и только на подписке).</Text>]
      : data.limits.map(limit => {
          const parts = bar(limit.percentUsed, width)
          return (
            <Box flexDirection="column">
              <Text>
                <Text bold>{(LABELS[limit.kind] ?? limit.kind).padEnd(8)}</Text>
                <Text color={barColor(limit.percentUsed)}>{parts.filled}</Text>
                <Text dimColor>{parts.empty}</Text>
                <Text> {Math.round(limit.percentUsed)}%</Text>
              </Text>
              <Text dimColor>{'        '}{untilReset(limit.resetsAt, now)}</Text>
            </Box>
          )
        })

    const context = data.contextPercent
    return (
      <Box flexDirection="column" alignItems="center" gap={1}>
        {sprite}
        <Box borderStyle="round" borderColor="#b8323a" paddingX={1}>
          <Text italic>«{line}»</Text>
        </Box>
        <Box flexDirection="column" alignSelf="flex-start">
          {rows}
          {context !== undefined && (
            <Text>
              <Text bold>{'Контекст'.padEnd(8)}</Text>
              <Text color={barColor(context)}>{bar(context, width).filled}</Text>
              <Text dimColor>{bar(context, width).empty}</Text>
              <Text> {context}%</Text>
            </Text>
          )}
          {data.costUsd !== undefined && data.costUsd > 0 && (
            <Text dimColor>Сессия стоит ${data.costUsd.toFixed(2)}</Text>
          )}
        </Box>
      </Box>
    )
  })
}
