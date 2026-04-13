import type { AlertButton } from "react-native";

/**
 * Web implementation of Alert that uses window.confirm / window.alert
 * since react-native-web's Alert.alert is a no-op.
 */
export const Alert = {
  alert(title: string, message?: string, buttons?: AlertButton[]) {
    const fullMessage = message ? `${title}\n\n${message}` : title;

    if (!buttons || buttons.length === 0) {
      window.alert(fullMessage);
      return;
    }

    if (buttons.length === 1) {
      window.alert(fullMessage);
      buttons[0].onPress?.();
      return;
    }

    // Two or more buttons: use confirm dialog.
    // The cancel-styled button maps to Cancel, the other to OK.
    const cancelButton = buttons.find((b) => b.style === "cancel");
    const actionButton =
      buttons.find((b) => b.style !== "cancel") ?? buttons[buttons.length - 1];

    const confirmed = window.confirm(fullMessage);
    if (confirmed) {
      actionButton?.onPress?.();
    } else {
      cancelButton?.onPress?.();
    }
  },
};
