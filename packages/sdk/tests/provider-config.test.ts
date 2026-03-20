import type { Api, Model } from "@mariozechner/pi-ai";
import { afterEach, describe, expect, it } from "vitest";
import {
  applyProxyToModel,
  buildCustomModel,
  loadSavedConfig,
  saveConfig,
  type ProviderConfig,
} from "../src/provider-config";

function makeConfig(overrides: Partial<ProviderConfig> = {}): ProviderConfig {
  return {
    provider: "openai",
    apiKey: "sk-test",
    model: "gpt-4",
    useProxy: false,
    proxyUrl: "",
    thinking: "none",
    followMode: true,
    expandToolCalls: false,
    ...overrides,
  };
}

const originalLocalStorage = globalThis.localStorage;

afterEach(() => {
  if (originalLocalStorage === undefined) {
    delete (globalThis as { localStorage?: Storage }).localStorage;
    return;
  }
  Object.defineProperty(globalThis, "localStorage", {
    value: originalLocalStorage,
    configurable: true,
    writable: true,
  });
});

describe("buildCustomModel", () => {
  it("returns null when apiType is missing", () => {
    expect(buildCustomModel(makeConfig({ provider: "custom" }))).toBeNull();
  });

  it("returns null when customBaseUrl is missing", () => {
    expect(
      buildCustomModel(
        makeConfig({ provider: "custom", apiType: "openai-completions" }),
      ),
    ).toBeNull();
  });

  it("returns null when model is missing", () => {
    expect(
      buildCustomModel(
        makeConfig({
          provider: "custom",
          apiType: "openai-completions",
          customBaseUrl: "http://localhost:11434",
          model: "",
        }),
      ),
    ).toBeNull();
  });

  it("returns a model when all required fields are present", () => {
    const model = buildCustomModel(
      makeConfig({
        provider: "custom",
        apiType: "openai-completions",
        customBaseUrl: "http://localhost:11434",
        model: "llama3",
      }),
    );
    expect(model).not.toBeNull();
    expect(model!.api).toBe("openai-completions");
    expect(model!.baseUrl).toBe("http://localhost:11434");
    expect(model!.contextWindow).toBe(128000);
    expect(model!.maxTokens).toBe(32000);
  });

  it("uses explicit custom context window and max tokens when provided", () => {
    const model = buildCustomModel(
      makeConfig({
        provider: "custom",
        apiType: "openai-completions",
        customBaseUrl: "http://localhost:11434",
        model: "llama3",
        customContextWindow: 256000,
        customMaxTokens: 64000,
      }),
    );

    expect(model).not.toBeNull();
    expect(model!.contextWindow).toBe(256000);
    expect(model!.maxTokens).toBe(64000);
  });

  it("treats zero custom limits as fallback to defaults", () => {
    const model = buildCustomModel(
      makeConfig({
        provider: "custom",
        apiType: "openai-completions",
        customBaseUrl: "http://localhost:11434",
        model: "llama3",
        customContextWindow: 0,
        customMaxTokens: 0,
      }),
    );

    expect(model).not.toBeNull();
    expect(model!.contextWindow).toBe(128000);
    expect(model!.maxTokens).toBe(32000);
  });
});

describe("applyProxyToModel", () => {
  const baseModel = {
    id: "gpt-4",
    name: "GPT-4",
    api: "openai-completions" as const,
    provider: "openai",
    baseUrl: "https://api.openai.com/v1",
    reasoning: true,
    input: ["text", "image"] as ("text" | "image")[],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  };

  it("returns model unchanged when proxy is disabled", () => {
    const config = makeConfig({ useProxy: false, proxyUrl: "" });
    const result = applyProxyToModel(baseModel, config);
    expect(result.baseUrl).toBe("https://api.openai.com/v1");
  });

  it("returns model unchanged when proxyUrl is empty", () => {
    const config = makeConfig({ useProxy: true, proxyUrl: "" });
    const result = applyProxyToModel(baseModel, config);
    expect(result.baseUrl).toBe("https://api.openai.com/v1");
  });

  it("wraps baseUrl through proxy when enabled", () => {
    const config = makeConfig({
      useProxy: true,
      proxyUrl: "https://proxy.example.com",
    });
    const result = applyProxyToModel(baseModel, config);
    expect(result.baseUrl).toBe(
      `https://proxy.example.com/?url=${encodeURIComponent("https://api.openai.com/v1")}`,
    );
  });

  it("returns model unchanged when model has no baseUrl", () => {
    const modelWithoutBase = { ...baseModel, baseUrl: undefined } as unknown as Model<Api>;
    const config = makeConfig({
      useProxy: true,
      proxyUrl: "https://proxy.example.com",
    });
    const result = applyProxyToModel(modelWithoutBase, config);
    expect(result.baseUrl).toBeUndefined();
  });
});

describe("saveConfig", () => {
  it("does not throw when localStorage does not expose setItem", () => {
    Object.defineProperty(globalThis, "localStorage", {
      value: { getItem: () => null },
      configurable: true,
      writable: true,
    });

    expect(() => saveConfig(makeConfig())).not.toThrow();
  });
});

describe("loadSavedConfig", () => {
  it("initializes missing custom endpoint limits to zero", () => {
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: () =>
          JSON.stringify({
            provider: "custom",
            apiKey: "sk-test",
            model: "llama3",
            useProxy: false,
            proxyUrl: "",
            thinking: "none",
            followMode: true,
            expandToolCalls: false,
            apiType: "openai-completions",
            customBaseUrl: "http://localhost:11434",
          }),
        setItem: () => undefined,
      },
      configurable: true,
      writable: true,
    });

    const config = loadSavedConfig();
    expect(config?.customContextWindow).toBe(0);
    expect(config?.customMaxTokens).toBe(0);
  });
});
