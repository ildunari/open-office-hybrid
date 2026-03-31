// @vitest-environment happy-dom

import { flushSync, mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const markdownMocks = vi.hoisted(() => ({
  renderMarkdown: vi.fn<
    (text: string, options?: { preferPlainCodeBlocks?: boolean }) => Promise<string>
  >(),
  renderMarkdownSync: vi.fn<
    (text: string, options?: { preferPlainCodeBlocks?: boolean }) => string
  >(),
}));

vi.mock("../src/chat/markdown", () => markdownMocks);

import MarkdownContentHarness from "./fixtures/markdown-content-harness.svelte";

type HarnessInstance = {
  setProps: (next: { text?: string; isStreaming?: boolean }) => void;
};

async function flushRenderedAsyncWork() {
  await Promise.resolve();
  await Promise.resolve();
  flushSync();
}

describe("MarkdownContent", () => {
  let target: HTMLDivElement;
  let harness: HarnessInstance | null = null;

  beforeEach(() => {
    vi.useFakeTimers();
    markdownMocks.renderMarkdown.mockReset();
    markdownMocks.renderMarkdownSync.mockReset();
    target = document.createElement("div");
    document.body.appendChild(target);
  });

  afterEach(async () => {
    if (harness) {
      await unmount(harness);
      harness = null;
    }
    document.body.innerHTML = "";
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("avoids rerendering when the text prop is set to the same value", async () => {
    markdownMocks.renderMarkdownSync.mockImplementation(
      (text, options) =>
        `<p>sync:${text}:${options?.preferPlainCodeBlocks ? "plain" : "settled"}</p>`,
    );
    markdownMocks.renderMarkdown.mockImplementation(async (text) => {
      return `<p>async:${text}</p>`;
    });

    harness = mount(MarkdownContentHarness, {
      target,
      props: { text: "Hello world", isStreaming: false },
    });
    flushSync();

    expect(markdownMocks.renderMarkdownSync).toHaveBeenCalledTimes(1);
    expect(target.innerHTML).toContain("sync:Hello world:settled");

    harness.setProps({ text: "Hello world" });
    flushSync();

    expect(markdownMocks.renderMarkdownSync).toHaveBeenCalledTimes(1);
    expect(markdownMocks.renderMarkdown).not.toHaveBeenCalled();

    vi.advanceTimersByTime(160);
    await flushRenderedAsyncWork();

    expect(markdownMocks.renderMarkdown).toHaveBeenCalledTimes(1);
    expect(markdownMocks.renderMarkdown).toHaveBeenCalledWith("Hello world", {
      preferPlainCodeBlocks: false,
    });
    expect(target.innerHTML).toContain("async:Hello world");
  });

  it("renders plain markdown while streaming and upgrades to settled markdown after streaming ends", async () => {
    const markdown = "```js\nconsole.log('hi');\n```";

    markdownMocks.renderMarkdownSync.mockImplementation(
      (_text, options) =>
        `<pre>${options?.preferPlainCodeBlocks ? "plain-streaming" : "plain-settled"}</pre>`,
    );
    markdownMocks.renderMarkdown.mockResolvedValue(
      "<div>highlighted-settled</div>",
    );

    harness = mount(MarkdownContentHarness, {
      target,
      props: { text: markdown, isStreaming: true },
    });
    flushSync();

    expect(markdownMocks.renderMarkdownSync).toHaveBeenCalledWith(markdown, {
      preferPlainCodeBlocks: true,
    });
    expect(target.innerHTML).toContain("plain-streaming");

    vi.advanceTimersByTime(500);
    await flushRenderedAsyncWork();

    expect(markdownMocks.renderMarkdown).not.toHaveBeenCalled();

    harness.setProps({ isStreaming: false });
    flushSync();

    expect(markdownMocks.renderMarkdownSync).toHaveBeenLastCalledWith(markdown, {
      preferPlainCodeBlocks: false,
    });
    expect(target.innerHTML).toContain("plain-settled");

    vi.advanceTimersByTime(160);
    await flushRenderedAsyncWork();

    expect(markdownMocks.renderMarkdown).toHaveBeenCalledTimes(1);
    expect(markdownMocks.renderMarkdown).toHaveBeenCalledWith(markdown, {
      preferPlainCodeBlocks: false,
    });
    expect(target.innerHTML).toContain("highlighted-settled");
  });

  it("reuses settled markdown across remounts for unchanged content", async () => {
    const markdown = "```js\nconsole.log('cached');\n```";

    markdownMocks.renderMarkdownSync.mockImplementation(
      (_text, options) =>
        `<pre>${options?.preferPlainCodeBlocks ? "plain-streaming" : "plain-settled"}</pre>`,
    );
    markdownMocks.renderMarkdown.mockResolvedValue(
      "<div>highlighted-cached</div>",
    );

    harness = mount(MarkdownContentHarness, {
      target,
      props: { text: markdown, isStreaming: false },
    });
    flushSync();

    vi.advanceTimersByTime(160);
    await flushRenderedAsyncWork();

    expect(markdownMocks.renderMarkdownSync).toHaveBeenCalledTimes(1);
    expect(markdownMocks.renderMarkdown).toHaveBeenCalledTimes(1);
    expect(target.innerHTML).toContain("highlighted-cached");

    await unmount(harness);
    harness = null;
    target.innerHTML = "";

    harness = mount(MarkdownContentHarness, {
      target,
      props: { text: markdown, isStreaming: false },
    });
    flushSync();

    expect(markdownMocks.renderMarkdownSync).toHaveBeenCalledTimes(1);
    expect(markdownMocks.renderMarkdown).toHaveBeenCalledTimes(1);
    expect(target.innerHTML).toContain("highlighted-cached");
  });
});
