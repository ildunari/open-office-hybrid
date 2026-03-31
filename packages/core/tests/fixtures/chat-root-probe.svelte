<script lang="ts">
  import { onMount } from "svelte";
  import { recordMount, recordUnmount } from "./tab-mount-probe-state";

  onMount(() => {
    recordMount("chat");
    return () => recordUnmount("chat");
  });
</script>

<div data-testid="chat-root-probe">chat root</div>
