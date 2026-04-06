# Privacy Policy

**Last updated:** April 6, 2026

This Privacy Policy describes how GRASS ("we," "us," or "our") collects, uses, and handles your information when you use the GRASS iOS application (the "App").

---

## 1. Overview

GRASS is a mobile client for running AI coding agents on your own development machines or cloud sandboxes. We are committed to collecting as little data as possible. Most of what you do in the App — browsing files, running agents, reviewing diffs — stays between your device and the server you connect to, which you control.

---

## 2. Information We Collect

### 2.1 Account Information

When you create an account or sign in, we collect:

- **Email address** — used to send you a one-time passcode (OTP) for authentication
- **Authentication token** — a session token issued after successful OTP verification, stored locally on your device in AsyncStorage

We do not collect passwords. Authentication is handled entirely via email OTP.

### 2.2 Container & Session Data

If you use GRASS-managed cloud containers (sandboxes provisioned through the App), we collect:

- **Container state** — whether your container is running, stopped, or provisioning
- **Container URL** — the URL assigned to your sandbox, stored on your device so the App can reconnect
- **Heartbeat signals** — periodic API calls to check whether your container is still alive

This data is processed by our backend at `revise.network` and is associated with your account.

### 2.3 Server URLs

Server addresses you add manually or via QR code scan are stored locally on your device using AsyncStorage. They are not transmitted to our servers.

### 2.4 Camera

The App requests access to your device's camera solely to scan QR codes. QR code scanning is performed entirely on-device. No images or video are captured, stored, or transmitted.

### 2.5 Chat & Agent Data

Messages you send, file contents, diffs, and agent responses are transmitted directly between your device and the GRASS server you connect to (either your own machine or your provisioned sandbox). **We do not have access to your chat messages, code, or file contents.**

### 2.6 Theme Preference

Your light/dark mode preference is stored locally on your device using AsyncStorage and is never transmitted to us.

---

## 3. Information We Do Not Collect

- We do not use advertising SDKs or collect advertising identifiers (IDFA)
- We do not use third-party analytics SDKs (e.g. Mixpanel, Amplitude, Firebase Analytics)
- We do not collect crash reports through third-party services (e.g. Sentry, Bugsnag) — if this changes, this policy will be updated
- We do not collect your location
- We do not access your contacts, calendar, microphone, or health data
- We do not collect device identifiers beyond what is necessary for authentication

---

## 4. How We Use Your Information

| Data | Purpose |
|------|---------|
| Email address | Send OTP for authentication; account recovery |
| Authentication token | Authorize API requests to provision and manage containers |
| Container state and URL | Display connection status; reconnect to your sandbox |
| Server URLs (local) | Show your saved server list in the App |

We do not sell, rent, or share your personal information with third parties for marketing purposes.

---

## 5. Data Storage & Security

- **On-device storage:** Server URLs, auth tokens, user info, and theme preferences are stored locally using React Native AsyncStorage on your device. This data is not backed up to iCloud by default.
- **Backend storage:** Your email address and container associations are stored on our servers at `revise.network`. Data is transmitted over HTTPS.
- **Retention:** Account data is retained for as long as your account is active. You may request deletion at any time (see Section 8).

---

## 6. Third-Party Services

### Your Own Servers

When you connect to a self-hosted GRASS server (your own machine or a third-party VM), your data flows directly to that server. We have no visibility into that connection. The privacy practices of your own infrastructure apply.

### AI Providers (Indirect)

GRASS is a client for AI coding agents such as Claude Code (by Anthropic). If your GRASS server is configured to use an AI provider, your chat messages may be sent to that provider according to their terms. We are not party to that data exchange. Please review the privacy policy of any AI provider your server is configured to use:

- Anthropic (Claude): https://www.anthropic.com/privacy

### Apple

The App is distributed through the Apple App Store. Apple's privacy practices apply to your use of the App Store and TestFlight. See Apple's Privacy Policy at https://www.apple.com/legal/privacy/.

---

## 7. Children's Privacy

The App is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, please contact us and we will delete it promptly.

---

## 8. Your Rights & Choices

Depending on your jurisdiction, you may have the right to:

- **Access** the personal data we hold about you
- **Correct** inaccurate data
- **Delete** your account and associated data
- **Withdraw consent** for data processing
- **Data portability** — receive a copy of your data in a structured format

To exercise any of these rights, contact us at the email address in Section 10. We will respond within 30 days.

**To delete your account:** Contact us with your registered email address and we will permanently delete your account and associated data from our servers.

---

## 9. Changes to This Policy

We may update this Privacy Policy from time to time. When we do, we will update the "Last updated" date at the top of this document. For material changes, we will notify you through the App or by email. Continued use of the App after changes take effect constitutes your acceptance of the updated policy.

---

## 10. Contact Us

If you have questions, concerns, or requests related to this Privacy Policy, please contact us at:

**GRASS**  
Email: [your-support-email@example.com]  
Website: [your-website.com]

---

*This policy covers the GRASS iOS application only. It does not cover the GRASS server software, which you run on your own infrastructure.*
