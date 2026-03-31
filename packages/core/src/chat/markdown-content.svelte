<script module lang="ts">
  const MAX_SETTLED_RENDER_CACHE_SIZE = 50;

  const settledHtmlCache = new Map<string, string>();
</script>

<script lang="ts">
  import type {
    LinkClickContext,
    LinkClickResult,
    MaybePromise,
  } from "./app-adapter";
  import { renderMarkdown, renderMarkdownSync } from "./markdown";

  interface Props {
    text: string;
    isStreaming?: boolean;
    onLinkClick?: (context: LinkClickContext) => MaybePromise<LinkClickResult>;
  }

  const STREAMING_RENDER_DELAY_MS = 100;
  const HIGHLIGHT_DELAY_MS = 160;
  const LARGE_STREAMING_TEXT_THRESHOLD = 1_000;

  let { text, isStreaming = false, onLinkClick }: Props = $props();

  let html = $state("");

  function cacheSettledHtml(text: string, rendered: string) {
    if (settledHtmlCache.has(text)) {
      settledHtmlCache.delete(text);
    } else if (settledHtmlCache.size >= MAX_SETTLED_RENDER_CACHE_SIZE) {
      const oldestKey = settledHtmlCache.keys().next().value;
      if (oldestKey !== undefined) {
        settledHtmlCache.delete(oldestKey);
      }
    }

    settledHtmlCache.set(text, rendered);
  }

  $effect(() => {
    const currentText = text;
    const currentStreaming = isStreaming;
    const cachedSettledHtml = currentStreaming
      ? undefined
      : settledHtmlCache.get(currentText);
    let cancelled = false;
    let plainRenderTimeout: number | undefined;
    let highlightTimeout: number | undefined;
    const renderOptions = {
      preferPlainCodeBlocks: currentStreaming,
    };

    const renderPlain = () => {
      const rendered = renderMarkdownSync(currentText, renderOptions);
      if (
        !cancelled &&
        text === currentText &&
        isStreaming === currentStreaming
      ) {
        html = rendered;
        return rendered;
      }

      return undefined;
    };

    const cleanup = () => {
      cancelled = true;
      if (plainRenderTimeout !== undefined) {
        clearTimeout(plainRenderTimeout);
      }
      if (highlightTimeout !== undefined) {
        clearTimeout(highlightTimeout);
      }
    };

    if (cachedSettledHtml !== undefined) {
      html = cachedSettledHtml;
      return cleanup;
    }

    if (
      currentStreaming &&
      currentText.length > LARGE_STREAMING_TEXT_THRESHOLD
    ) {
      plainRenderTimeout = window.setTimeout(
        renderPlain,
        STREAMING_RENDER_DELAY_MS,
      );
    } else {
      renderPlain();
    }

    if (currentStreaming) {
      return cleanup;
    }

    highlightTimeout = window.setTimeout(() => {
      void renderMarkdown(currentText, renderOptions)
        .then((rendered) => {
          if (
            !cancelled &&
            text === currentText &&
            isStreaming === currentStreaming
          ) {
            html = rendered;
            cacheSettledHtml(currentText, rendered);
          }
        })
        .catch(() => {
          const rendered = renderPlain();
          if (rendered !== undefined) {
            cacheSettledHtml(currentText, rendered);
          }
        });
    }, HIGHLIGHT_DELAY_MS);

    return cleanup;
  });

  async function handleClick(event: MouseEvent) {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const link = target.closest("a[href]");
    if (!(link instanceof HTMLAnchorElement)) return;

    const href = link.getAttribute("href");
    if (!href) return;

    if (
      onLinkClick &&
      (await onLinkClick({ href, anchor: link, event })) === "handled"
    ) {
      event.preventDefault();
    }
  }

  function handleKeydown() {
    // The wrapper only delegates clicks to links rendered inside sanitized HTML.
  }
</script>

<div
  class="markdown-content"
  onclick={handleClick}
  onkeydown={handleKeydown}
  role="presentation"
>
  {@html html}
</div>
