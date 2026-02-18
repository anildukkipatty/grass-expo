# How to Install on iPhone (Without Expo Go or TestFlight)

Install directly on your iPhone using Xcode with a free Apple Developer account.

## Prerequisites
- Mac with Xcode installed
- iPhone connected via USB
- Free Apple ID (no paid developer account needed for personal use on 1 device)

## Steps

### 1. Build the native iOS project

```bash
npx expo prebuild --platform ios
```

This generates the `ios/` folder with an Xcode project.

### 2. Open in Xcode

```bash
open ios/*.xcworkspace
```

### 3. Configure signing
1. Select the project in the left sidebar
2. Go to **Signing & Capabilities** tab
3. Check **Automatically manage signing**
4. Set **Team** to your personal Apple ID (add it under Xcode → Settings → Accounts if needed)
5. Change the **Bundle Identifier** to something unique like `com.yourname.grasspingpong`

### 4. Trust your device
- Connect iPhone via USB
- In Xcode, select your iPhone as the build target (top bar)
- On first run, go to **iPhone Settings → General → VPN & Device Management** and trust your developer certificate

### 5. Build & install

Hit the **Play button** in Xcode, or run:

```bash
npx expo run:ios --device
```

The app installs directly on your phone.

## Caveats
- Free Apple ID certs expire every **7 days** — you'll need to rebuild/reinstall weekly
- Max **3 apps** per free account on device at once
- No push notifications with free account

A paid Apple Developer account ($99/year) removes these limits.
