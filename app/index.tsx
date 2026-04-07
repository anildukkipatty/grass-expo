import { Redirect } from "expo-router";

// TEMPORARY: redirecting to push-commit for UI review
export default function Index() {
  return <Redirect href={{ pathname: "/push-commit", params: { serverUrl: "" } }} />;
}
