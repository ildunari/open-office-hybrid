<script lang="ts">
  import ResumeTaskBanner from "../../src/chat/resume-task-banner.svelte";
  import { setChatContext } from "../../src/chat/chat-runtime-context";

  interface ChatLike {
    resumeFromHandoff: () => void;
  }

  interface Props {
    message: string | null;
    canResume?: boolean;
    chat: ChatLike;
  }

  let { message, canResume = false, chat }: Props = $props();

  setChatContext({
    resumeFromHandoff: () => chat.resumeFromHandoff(),
  } as never);
</script>

<ResumeTaskBanner {message} {canResume} />
