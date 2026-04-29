import semver from 'semver';
import { APP_VERSION, APP_MIN_SERVER_RANGE } from '@/constants/versions';

export interface CompatResult {
  compatible: boolean;
}

/**
 * Bidirectional OR compatibility check — the app is the final authority.
 *
 * serverSaysOK = server's clientVersionRange includes APP_VERSION
 * appSaysOK    = app's APP_MIN_SERVER_RANGE includes serverVersion
 *
 * compatible = serverSaysOK OR appSaysOK
 *
 * OR logic means: if either party vouches for the connection, proceed.
 * This lets a newer app override a server's stale range declaration.
 *
 * Missing version fields (old server) → treat as compatible.
 */
export function checkVersionCompat(
  serverVersion: string | null,
  clientVersionRange: string | null,
): CompatResult {
  // Old server predating this feature — assume compatible
  if (!serverVersion && !clientVersionRange) return { compatible: true };

  const serverSaysOK =
    clientVersionRange != null &&
    semver.validRange(clientVersionRange) != null &&
    semver.valid(APP_VERSION) != null &&
    semver.satisfies(APP_VERSION, clientVersionRange);

  const appSaysOK =
    serverVersion != null &&
    semver.valid(serverVersion) != null &&
    semver.satisfies(serverVersion, APP_MIN_SERVER_RANGE);

  return { compatible: !!(serverSaysOK || appSaysOK) };
}
