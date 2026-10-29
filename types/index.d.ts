export type Limit = { kind: string; percentUsed: number; resetsAt?: string }

export type Usage = {
  limits: Limit[]
  contextPercent?: number
  costUsd?: number
}

declare module 'claude-code' {
  interface PluginState {
    'kurisu-limits': {
      usage: Shaped<Usage>
      isHidden: boolean
      nickname: number
    }
  }
}
