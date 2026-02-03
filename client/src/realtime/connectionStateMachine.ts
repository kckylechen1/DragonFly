export type ConnectionState =
  | 'IDLE'
  | 'CONNECTING'
  | 'OPEN'
  | 'RECONNECTING'
  | 'CLOSED'
  | 'ERROR';

type StateChangeHandler = (state: ConnectionState) => void;

export class ConnectionStateMachine {
  private _state: ConnectionState = 'IDLE';
  private _onStateChange: StateChangeHandler | null = null;

  constructor(initialState: ConnectionState = 'IDLE') {
    this._state = initialState;
  }

  get state() {
    return this._state;
  }

  transition(newState: ConnectionState) {
    if (this._state === newState) return;

    console.log(`[Connection] ${this._state} -> ${newState}`);
    this._state = newState;

    if (this._onStateChange) {
      this._onStateChange(newState);
    }
  }

  isBusy(): boolean {
    return (
      this._state === 'CONNECTING' ||
      this._state === 'OPEN' ||
      this._state === 'RECONNECTING'
    );
  }

  subscribe(callback: StateChangeHandler) {
    this._onStateChange = callback;
    return () => {
      this._onStateChange = null;
    };
  }
}
