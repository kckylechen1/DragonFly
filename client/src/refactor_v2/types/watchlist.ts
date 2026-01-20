export interface WatchlistItem {
  symbol: string;
  name: string;
  groupId?: string;
}

export interface WatchlistGroup {
  id: string;
  name: string;
  order: number;
}

export interface WatchlistState {
  currentSymbol: string;
  watchlist: WatchlistItem[];
  groups?: WatchlistGroup[];
}

export interface WatchlistActions {
  setCurrentSymbol: (symbol: string) => void;
  addToWatchlist: (item: WatchlistItem) => void;
  removeFromWatchlist: (symbol: string) => void;
}

export type WatchlistStore = WatchlistState & WatchlistActions;
