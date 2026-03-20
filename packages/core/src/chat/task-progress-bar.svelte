<script lang="ts">
  interface Props {
    completed: number;
    total: number;
  }

  let { completed, total }: Props = $props();

  const percent = $derived(total > 0 ? Math.round((completed / total) * 100) : 0);
</script>

<div class="flex items-center gap-2">
  <div class="flex-1 h-1.5 bg-(--chat-bg-secondary) rounded-full overflow-hidden">
    <div
      class="h-full bg-(--chat-accent) transition-[width] duration-200"
      style={`width: ${percent}%`}
    ></div>
  </div>
  <span class="text-[10px] text-(--chat-text-muted) uppercase tracking-wider">
    {completed}/{total}
  </span>
</div>
