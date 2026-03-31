<script lang="ts">
  import MarkdownContent from "../../src/chat/markdown-content.svelte";

  interface Props {
    text: string;
    isStreaming?: boolean;
  }

  let { text = "", isStreaming = false }: Props = $props();

  export function setProps(next: Partial<Props>) {
    if (next.text !== undefined) {
      text = next.text;
    }
    if (next.isStreaming !== undefined) {
      isStreaming = next.isStreaming;
    }
  }
</script>

<MarkdownContent {text} {isStreaming} />
