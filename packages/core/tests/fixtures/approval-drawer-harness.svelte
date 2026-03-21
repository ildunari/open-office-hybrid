<script lang="ts">
  import type { ApprovalRequest, PermissionMode } from "@office-agents/sdk";
  import ApprovalDrawer from "../../src/chat/approval-drawer.svelte";
  import { setChatContext } from "../../src/chat/chat-runtime-context";

  interface ChatLike {
    approvePending: () => void;
  }

  interface Props {
    approval: ApprovalRequest | null;
    permissionMode: PermissionMode;
    chat: ChatLike;
  }

  let { approval, permissionMode, chat }: Props = $props();

  setChatContext({
    approvePending: () => chat.approvePending(),
  } as never);
</script>

<ApprovalDrawer {approval} {permissionMode} />
