import { expect, mock, test } from 'claude-code/testing'

const BAND = {
  plugin: 'kurisu-limits',
  component: 'AbovePrompt',
  requestId: 'above-prompt',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 20,
    bodyColumns: 120,
    scroll: { offset: 0, bodyRows: 20 },
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

test('the band shows the limits and the reset time', async ($, on) => {
  mock.clock(on, { now: Date.parse('2098-12-31T22:00:00Z') })
  on('ui.status', () => ({ value: {} }))
  on('ui.toast', () => ({ value: {} }))
  on('command.register', () => ({ value: { command: 'kurisu' } }))
  on('session.usage', () => ({ value: { startedAt: 0, context: { window: 200000 }, rateLimits: [] } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.measure', (_, e) => ({ changed: e.changed }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.session.measure(MEASURE)

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface })
    const five = await ui.find({ type: 'Text', text: /5 часов/ })
    expect(five?.text).toContain('43%')
    expect(five?.text).toContain('через 2 ч 0 мин')
    expect(five?.text).toContain('сброс в ')
    expect((await ui.find({ type: 'Text', text: /Неделя/ }))?.text).toContain('91%')
    expect((await ui.find({ type: 'Text', text: /контекст 25%/ }))?.text).toContain('сессия $1.50')
    expect(await ui.find({ type: 'Text', text: /Лимит почти кончился|Ещё пара запросов/ })).toBeDefined()
    await ui.unmount()
  }
})

test('without limits the band says so', async ($, on) => {
  mock.clock(on)
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /Лимиты появятся/ })).toBeDefined()
  await ui.unmount()
})

test('/kurisu hides the band and brings it back', async ($, on) => {
  mock.clock(on)
  on('command.run', () => ({ text: '' }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })

  await $.command.run({ command: 'kurisu', args: '' })
  const hidden = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await hidden.find({ type: 'Text', text: /engine/ })).toBeDefined()
  await hidden.unmount()

  await $.command.run({ command: 'kurisu', args: '' })
  const shown = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await shown.find({ type: 'Text', text: /Лимиты появятся/ })).toBeDefined()
  await shown.unmount()
})
