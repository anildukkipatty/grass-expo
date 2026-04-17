import { NativeTabs } from "expo-router/unstable-native-tabs";

export default function NewNavbarLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="permissions">
        <NativeTabs.Trigger.Icon sf="bolt.fill" md="bolt" />
        <NativeTabs.Trigger.Label>Permissions</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="repos">
        <NativeTabs.Trigger.Icon sf="tray.fill" md="inbox" />
        <NativeTabs.Trigger.Label>Repos</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="new" role="search">
        <NativeTabs.Trigger.Icon sf="plus" md="add" />
        <NativeTabs.Trigger.Label>New</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Slot name="index" />
      <NativeTabs.Slot name="permissions" />
      <NativeTabs.Slot name="repos" />
      <NativeTabs.Slot name="new" />
    </NativeTabs>
  );
}
