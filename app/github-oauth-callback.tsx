import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import * as WebBrowser from "expo-web-browser";

/**
 * Web-only route that handles the GitHub OAuth redirect.
 * On native, the custom scheme (grass://) is intercepted by
 * WebBrowser.openAuthSessionAsync, so this page is never reached.
 * On web, the browser navigates here after OAuth completes —
 * we just need to dismiss the auth session so control returns
 * to the opener window.
 */
export default function GitHubOAuthCallback() {
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
