<script lang="ts">
  import {
    ChatInterface,
    deleteFile,
    ErrorBoundary,
    readFile,
    readFileBuffer,
    setBridgeController,
    snapshotVfs,
    writeFile,
  } from "@office-agents/core";
  import { onMount } from "svelte";
  import { createWordAdapter } from "../../lib/adapter";

  const adapter = createWordAdapter();

  onMount(() => {
    if (!import.meta.env.DEV) return undefined;

    let stopped = false;
    let stopBridge: (() => void) | undefined;

    void import("@office-agents/bridge/client").then(({ startOfficeBridge }) => {
      if (stopped) return;

      const bridge = startOfficeBridge({
        app: "word",
        adapter,
        serverUrl: "wss://localhost:4018/ws",
        vfs: {
          snapshot: snapshotVfs,
          readFile,
          readFileBuffer,
          writeFile,
          deleteFile,
        },
      });
      setBridgeController(bridge);
      stopBridge = () => {
        setBridgeController(null);
        bridge.stop();
      };
    });

    return () => {
      stopped = true;
      stopBridge?.();
    };
  });
</script>

<ErrorBoundary>
  <div class="h-screen w-full overflow-hidden">
    <ChatInterface {adapter} />
  </div>
</ErrorBoundary>
