import { expect, mock, test } from 'claude-code/testing'

const PANE = {
  plugin: 'kurisu-limits',
  component: 'Pane',
  requestId: 'kurisu',
  props: {
    title: 'Курису · лимиты',
    isFocused: false,
    bodyColumns: 40,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

const MEASURE = {
  context: { tokens: 50000, window: 200000, percent: 25 },
  rateLimits: [
    { kind: 'five_hour', percentUsed: 42.5, resetsAt: '2099-01-01T00:00:00Z' },
    { kind: 'seven_day', percentUsed: 91 },
  ],
  cost: { usd: 1.5 },
  changed: ['context', 'rateLimits', 'cost'],
} as const

test('the pane shows the limits on every surface', async ($, on) => {
  mock.clock(on, { now: Date.parse('2098-12-31T22:00:00Z') })
  on('ui.status', () => ({ value: {} }))
  on('ui.toast', () => ({ value: {} }))
  on('command.register', () => ({ value: { command: 'kurisu' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.usage', () => ({ value: { startedAt: 0, context: { window: 200000 }, rateLimits: [] } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.measure', (_, e) => ({ changed: e.changed }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.session.measure(MEASURE)

  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect((await ui.find({ type: 'Text', text: /5 часов/ }))?.text).toContain('43%')
    expect(await ui.find({ type: 'Text', text: /сброс через 2 ч 0 мин/ })).toBeDefined()
    expect((await ui.find({ type: 'Text', text: /Неделя/ }))?.text).toContain('91%')
    expect((await ui.find({ type: 'Text', text: /Контекст/ }))?.text).toContain('25%')
    expect((await ui.find({ type: 'Text', text: /Лимит почти кончился|Ещё пара запросов/ }))).toBeDefined()
    await ui.unmount()
  }
})

test('without limits the pane says so', async ($, on) => {
  mock.clock(on)
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /Данных о лимитах пока нет/ })).toBeDefined()
  await ui.unmount()
})
