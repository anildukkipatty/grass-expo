import { fetch } from "expo/fetch";

/**
 * Fetch against a Grass VM (often a Daytona preview URL). Browsers otherwise receive
 * Daytona's HTML "Preview URL Warning" interstitial instead of JSON/SSE — send the
 * header they document for programmatic access.
 * @see https://www.daytona.io/docs/en/preview-and-authentication/
 */
export function vmFetch(
  input: string,
  init?: RequestInit & { reactNativeFetchMode?: string },
): ReturnType<typeof fetch> {
  const next = { ...(init ?? {}) } as RequestInit & {
    reactNativeFetchMode?: string;
  };
  const h = new Headers(next.headers as HeadersInit | undefined);
  h.set("X-Daytona-Skip-Preview-Warning", "true");
  next.headers = h;
  return fetch(input, next as Parameters<typeof fetch>[1]);
}
