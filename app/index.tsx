import { getToken } from "@/store/auth-store";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const [route, setRoute] = useState<"/onboarding" | "/new-navbar" | null>(
    null,
  );

  useEffect(() => {
    getToken().then((token) => {
      setRoute("/onboarding");
    });
  }, []);

  if (!route) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Redirect href={route} />;
}
