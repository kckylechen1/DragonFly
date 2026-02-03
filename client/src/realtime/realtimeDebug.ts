const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

interface RealtimeStats {
  ticksIn: number;
  ticksDropped: number;
  flushCount: number;
  avgFlushMs: number;
  wsState: string;
  sseState: string;
  lastError: string | null;
}

class RealtimeDebugger {
  private stats: RealtimeStats = {
    ticksIn: 0,
    ticksDropped: 0,
    flushCount: 0,
    avgFlushMs: 0,
    wsState: 'IDLE',
    sseState: 'IDLE',
    lastError: null,
  };

  private flushTimes: number[] = [];
  private intervalId: ReturnType<typeof setInterval> | null = null;

  recordTick(dropped: boolean = false) {
    if (!DEBUG_ENABLED) return;
    this.stats.ticksIn++;
    if (dropped) this.stats.ticksDropped++;
  }

  recordFlush(durationMs: number) {
    if (!DEBUG_ENABLED) return;
    this.stats.flushCount++;
    this.flushTimes.push(durationMs);
    if (this.flushTimes.length > 100) this.flushTimes.shift();

    this.stats.avgFlushMs =
      this.flushTimes.reduce((a, b) => a + b, 0) / this.flushTimes.length;

    if (durationMs > 16) {
      console.warn(
        `[realtime] flush took ${durationMs.toFixed(1)}ms (>16ms frame budget)`
      );
    }
  }

  setWsState(state: string) {
    this.stats.wsState = state;
  }

  setSseState(state: string) {
    this.stats.sseState = state;
  }

  setError(error: string) {
    this.stats.lastError = error;
  }

  getStats(): RealtimeStats {
    return { ...this.stats };
  }

  startPeriodicLog() {
    if (!DEBUG_ENABLED || this.intervalId) return;
    this.intervalId = setInterval(() => {
      console.table(this.getStats());
    }, 10000);
  }

  stopPeriodicLog() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  reset() {
    this.stats = {
      ticksIn: 0,
      ticksDropped: 0,
      flushCount: 0,
      avgFlushMs: 0,
      wsState: 'IDLE',
      sseState: 'IDLE',
      lastError: null,
    };
    this.flushTimes = [];
  }
}

export const realtimeDebug = new RealtimeDebugger();
