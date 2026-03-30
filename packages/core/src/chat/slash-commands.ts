import type { ChatController } from "./chat-controller";

export interface SlashCommand {
  name: string;
  description: string;
  handler: (chat: ChatController) => void | Promise<void>;
}

export const defaultCommands: SlashCommand[] = [
  {
    name: "compact",
    description: "Compact context — summarize history and free up space",
    handler: (chat) => {
      void chat.compactContext().catch(console.error);
    },
  },
];

export function filterCommands(
  query: string,
  commands: SlashCommand[],
): SlashCommand[] {
  const q = query.toLowerCase();
  return commands.filter((c) => c.name.startsWith(q));
}
