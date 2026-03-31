<script lang="ts">
  import { onMount } from "svelte";
  import { recordMount, recordUnmount } from "./tab-mount-probe-state";

  onMount(() => {
    recordMount("settings");
    return () => recordUnmount("settings");
  });
</script>

<div data-testid="settings-root-probe">settings root</div>
