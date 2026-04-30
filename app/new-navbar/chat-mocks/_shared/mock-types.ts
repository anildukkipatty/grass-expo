export type MockMessage =
  | { id: string; role: "user"; content: string }
  | {
      id: string;
      role: "tool";
      tool: "read" | "grep" | "edit" | "write" | "bash";
      label: string;
    }
  | { id: string; role: "assistant"; content: string }
  | { id: string; role: "permission"; toolName: string; command: string };

export type MockConversation = {
  repoName: string;
  repoPath: string;
  branch: string;
  agent: "claude-code" | "opencode";
  modelLabel: string;
  sessionTitle: string;
  messages: MockMessage[];
  streaming: boolean;
};
