import { Redirect } from "expo-router";

export default function Index() {
  // DEMO MODE — entry point routes to onboarding mockups picker.
  // Original auth-gated routing preserved below. To restore, swap the
  // returned <Redirect /> for the commented block.
  return <Redirect href={"/onboarding-mockups" as any} />;

  // import { getToken } from "@/store/auth-store";
  // import { useEffect, useState } from "react";
  // import { ActivityIndicator, View } from "react-native";
  // const [route, setRoute] = useState<"/onboarding" | "/new-navbar" | null>(null);
  // useEffect(() => {
  //   getToken().then((token) => {
  //     setRoute(token ? "/new-navbar" : "/onboarding");
  //   });
  // }, []);
  // if (!route) {
  //   return (
  //     <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
  //       <ActivityIndicator />
  //     </View>
  //   );
  // }
  // return <Redirect href={route} />;
}
