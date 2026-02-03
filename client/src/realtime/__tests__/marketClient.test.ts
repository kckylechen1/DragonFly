import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MarketClient } from "../marketClient";

// Mock WebSocket
class MockWebSocket {
  static instances: MockWebSocket[] = [];

  readyState = 0; // CONNECTING
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: ((e: { wasClean: boolean }) => void) | null = null;
  onerror: (() => void) | null = null;

  sentMessages: string[] = [];

  constructor(_url: string) {
    MockWebSocket.instances.push(this);
  }

  send(data: string) {
    this.sentMessages.push(data);
  }

  close() {
    this.readyState = 3; // CLOSED
    this.onclose?.({ wasClean: true });
  }

  // 模拟连接打开
  simulateOpen() {
    this.readyState = 1; // OPEN
    this.onopen?.();
  }

  // 模拟收到消息
  simulateMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
}

// Mock stores
vi.mock("../../stores/connection.store", () => ({
  useConnectionStore: {
    getState: () => ({
      setWsStatus: vi.fn(),
    }),
  },
}));

vi.mock("../../stores/market.store", () => ({
  useMarketStore: {
    getState: () => ({
      setOrderbook: vi.fn(),
    }),
  },
}));

vi.mock("../tickBuffer", () => ({
  tickBuffer: {
    add: vi.fn(),
  },
}));

describe("MarketClient", () => {
  let client: MarketClient;
  let originalWebSocket: typeof WebSocket;

  beforeEach(() => {
    MockWebSocket.instances = [];
    originalWebSocket = globalThis.WebSocket;
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;

    client = new MarketClient();
  });

  afterEach(() => {
    client.dispose();
    globalThis.WebSocket = originalWebSocket;
    vi.clearAllMocks();
  });

  describe("subscribe/unsubscribe", () => {
    it("should track reference count", () => {
      client.connect("wss://test");
      MockWebSocket.instances[0].simulateOpen();

      client.subscribe("AAPL");
      expect(client.getRefCount("AAPL")).toBe(1);

      client.subscribe("AAPL");
      expect(client.getRefCount("AAPL")).toBe(2);

      client.unsubscribe("AAPL");
      expect(client.getRefCount("AAPL")).toBe(1);

      client.unsubscribe("AAPL");
      expect(client.getRefCount("AAPL")).toBe(0);
    });

    it("should only send subscribe message on first subscription", () => {
      client.connect("wss://test");
      const ws = MockWebSocket.instances[0];
      ws.simulateOpen();

      client.subscribe("AAPL");
      client.subscribe("AAPL");
      client.subscribe("AAPL");

      const subscribeMessages = ws.sentMessages.filter((m) =>
        m.includes("subscribe")
      );
      expect(subscribeMessages).toHaveLength(1);
    });

    it("should only send unsubscribe message on last unsubscription", () => {
      client.connect("wss://test");
      const ws = MockWebSocket.instances[0];
      ws.simulateOpen();

      client.subscribe("AAPL");
      client.subscribe("AAPL");
      client.unsubscribe("AAPL");
      client.unsubscribe("AAPL");

      const unsubscribeMessages = ws.sentMessages.filter((m) =>
        m.includes("unsubscribe")
      );
      expect(unsubscribeMessages).toHaveLength(1);
    });
  });

  describe("getSubscribedSymbols", () => {
    it("should return list of subscribed symbols", () => {
      client.connect("wss://test");
      MockWebSocket.instances[0].simulateOpen();

      client.subscribe("AAPL");
      client.subscribe("GOOG");
      client.subscribe("MSFT");

      expect(client.getSubscribedSymbols()).toEqual(["AAPL", "GOOG", "MSFT"]);
    });
  });

  describe("connect", () => {
    it("should create WebSocket connection", () => {
      client.connect("wss://test");
      expect(MockWebSocket.instances).toHaveLength(1);
    });

    it("should not create duplicate connections", () => {
      client.connect("wss://test");
      MockWebSocket.instances[0].simulateOpen();
      client.connect("wss://test");
      expect(MockWebSocket.instances).toHaveLength(1);
    });
  });

  describe("disconnect", () => {
    it("should close WebSocket connection", () => {
      client.connect("wss://test");
      const ws = MockWebSocket.instances[0];
      ws.simulateOpen();

      client.disconnect();
      expect(ws.readyState).toBe(3); // CLOSED
    });
  });
});
