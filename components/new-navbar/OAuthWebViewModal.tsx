import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView, WebViewNavigation } from "react-native-webview";
import { SFPro } from "@/constants/theme";

type Props = {
  visible: boolean;
  authUrl: string;
  /** Prefix to intercept (e.g. "http://localhost:1455/auth/callback"). The
   *  first navigation whose URL starts with this prefix is captured — the
   *  WebView never actually loads it. */
  redirectPrefix: string;
  /** Heading shown in the modal's nav bar. */
  title?: string;
  /** Fires once when the redirect URL is intercepted. The handler receives
   *  the full URL so it can pull whatever it needs (`code`, `state`, etc.). */
  onCallback: (url: string) => void;
  onCancel: () => void;
};

export function OAuthWebViewModal({
  visible,
  authUrl,
  redirectPrefix,
  title = "Sign in",
  onCallback,
  onCancel,
}: Props) {
  const [loading, setLoading] = useState(true);
  const intercepted = useRef(false);

  const handleShouldStartLoad = useCallback(
    (request: WebViewNavigation) => {
      if (request.url.startsWith(redirectPrefix) && !intercepted.current) {
        intercepted.current = true;
        onCallback(request.url);
        return false;
      }
      return true;
    },
    [onCallback, redirectPrefix],
  );

  const handleClose = useCallback(() => {
    intercepted.current = false;
    onCancel();
  }, [onCancel]);

  if (!visible) return null;

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} hitSlop={10}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {loading && (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color="#3D841E" />
          </View>
        )}

        <WebView
          source={{ uri: authUrl }}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          incognito
          userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1"
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#DFDFDF",
  },
  cancelText: { fontFamily: SFPro.regular, fontSize: 16, color: "#3D841E" },
  headerTitle: { fontFamily: SFPro.semiBold, fontSize: 16, color: "#000" },
  headerSpacer: { width: 60 },
  loadingOverlay: {
    position: "absolute",
    top: 80,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  webview: { flex: 1 },
});
