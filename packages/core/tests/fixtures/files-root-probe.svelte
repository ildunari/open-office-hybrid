<script lang="ts">
  import { onMount } from "svelte";
  import { recordMount, recordUnmount } from "./tab-mount-probe-state";

  onMount(() => {
    recordMount("files");
    return () => recordUnmount("files");
  });
</script>

<div data-testid="files-root-probe">files root</div>
