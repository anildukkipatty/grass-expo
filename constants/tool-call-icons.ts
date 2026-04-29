// Shared tool-call icon mapping used by chat UIs.
// Normalizes tool names from SSE/tool history events and returns an emoji icon.

export function parseToolNameFromToolMessage(content: string): string {
  return content.split(":")[0]?.trim() ?? content.trim();
}

export function getToolCallIcon(toolName: string): string {
  const key = toolName.toLowerCase().replace(/[_\s]/g, "");

  switch (key) {
    // File read
    case "read":
    case "readfile":
    case "notebookread":
      return "📖";

    // File write / create
    case "write":
    case "writefile":
      return "✏️";

    // File edit / patch
    case "edit":
    case "editfile":
    case "multiedit":
    case "patch":
      return "📝";

    // Shell / terminal
    case "bash":
    case "shell":
    case "terminal":
    case "execute":
      return "⚡";

    // Content search
    case "grep":
    case "search":
      return "🔍";

    // File/path search
    case "glob":
    case "ls":
    case "listdir":
    case "listfiles":
      return "🗂️";

    // Web fetch
    case "webfetch":
    case "fetch":
    case "http":
      return "🌐";

    // Web search
    case "websearch":
      return "🔎";

    // Notebook
    case "notebookedit":
      return "📒";

    // Task / subagent
    case "task":
    case "agent":
    case "subagent":
      return "🤖";

    // Todo
    case "todoread":
    case "todowrite":
      return "📋";

    // Git / diff
    case "diff":
    case "gitdiff":
      return "🔀";

    // MCP / plugin tools
    case "mcptool":
    case "mcp":
      return "🔌";

    default:
      return "🔧";
  }
}
