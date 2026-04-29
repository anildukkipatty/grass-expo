# GRASS iOS App Store Submission Checklist

> **App:** GRASS  
> **Bundle ID:** `com.grass-ide.ios`  
> **Expo SDK:** 54  |  **React Native:** 0.81.5  
> **EAS Project ID:** `5f83639c-9362-4793-86cd-31ab41f09788`  
> **EAS Owner:** `anildukkipatty`

Use this checklist to track everything needed before submitting to the Apple App Store. Work through phases in order — each phase unblocks the next.

---

## Phase 1: Apple Developer Account

- [ ] **Apple Developer Program enrollment confirmed** ($99/year active subscription)
  - Verify at [developer.apple.com/account](https://developer.apple.com/account)
  - Account must be under the legal entity name that will appear in the App Store
- [ ] **Two-factor authentication enabled** on the Apple ID used for the account
- [ ] **App record created in App Store Connect**
  - Bundle ID registered: `com.grass-ide.ios`
  - App name: GRASS
  - Primary language set
  - Category selected (e.g. Developer Tools)
- [ ] **Team roles assigned** — anyone who needs App Store Connect access has been invited with appropriate role (Admin or App Manager for submission, Developer for builds)

---

## Phase 2: EAS & Build Setup

These steps are already partially configured in `eas.json` and `app.json`. Verify each one.

- [ ] **EAS CLI is up to date** — run `npm install -g eas-cli` and confirm version `>= 18.0.5`
- [ ] **Logged in to EAS** as `anildukkipatty` — run `eas whoami`
- [ ] **`eas.json` production profile is correct**
  - `autoIncrement: true` is set (it is) — confirms build numbers increment automatically
  - `buildType` defaults to `app-store` for production iOS — confirm this is the intent
- [ ] **`app.json` iOS section is complete**
  - `bundleIdentifier`: `com.grass-ide.ios` ✓
  - `version`: `1.0.0` ✓ — update if this is not the first submission
  - `supportsTablet`: `true` ✓
  - `ITSAppUsesNonExemptEncryption`: `false` ✓ (handles export compliance automatically)
  - `NSCameraUsageDescription` is set ✓ — verify wording is user-friendly and accurate
- [ ] **No other permissions used without `infoPlist` entries** — audit the codebase for any other permission-triggering APIs (location, microphone, contacts, etc.)
- [ ] **Production build succeeds cleanly**
  ```bash
  eas build --platform ios --profile production
  ```
  - Build completes without errors
  - IPA file size is reasonable (check it isn't unexpectedly large)
  - Bundle ID in the artifact matches `com.grass-ide.ios`

---

## Phase 3: Code Quality & App Stability

> **Note:** Crashes on launch are the #1 rejection reason. This phase is critical.

- [ ] **No crashes on launch** — tested on a real physical iPhone (not just Simulator)
- [ ] **No crashes during normal use** — tested all primary user flows end-to-end:
  - [ ] App launch → home screen loads
  - [ ] Adding a server URL manually
  - [ ] QR code scanning flow (camera permission prompt appears, scanning works)
  - [ ] Navigating to folders / repo list
  - [ ] Starting a new chat session
  - [ ] Sending messages and receiving SSE responses
  - [ ] Diff viewer loads correctly
  - [ ] Light/dark theme toggle works
  - [ ] App goes to background and returns without crashing or hanging
- [ ] **Tested on multiple device sizes**
  - [ ] iPhone SE (small screen)
  - [ ] iPhone 15 / 16 (standard)
  - [ ] iPhone 15 Plus / 16 Plus (large)
  - [ ] iPad (since `supportsTablet: true`)
- [ ] **Tested on multiple iOS versions** (iOS 16, 17, 18 minimum)
- [ ] **No `console.log` / debug output in production code** — search the codebase:
  ```bash
  grep -r "console\.log" app/ components/ store/ hooks/ --include="*.ts" --include="*.tsx"
  ```
- [ ] **No hardcoded API keys, tokens, or credentials** in any source file
- [ ] **All advertised/shown features actually work** — remove or hide any screens that are incomplete or placeholder
- [ ] **Error states handled gracefully** — network failures, server unreachable, etc. show a user-friendly message
- [ ] **Home indicator is not obscured** — Safe Area Insets are respected throughout the app
- [ ] **Dynamic Island / notch is handled** correctly on all supported devices

---

## Phase 4: Assets & App Icon

- [ ] **App icon (`assets/images/icon.png`)** meets Apple requirements:
  - [ ] 1024 x 1024 px
  - [ ] PNG format, no transparency (Apple rejects icons with alpha channels)
  - [ ] No rounded corners — Apple applies them automatically
  - [ ] No text that says "beta", "lite", "free", or prices
  - Verify the current `icon.png` meets these specs
- [ ] **Splash screen** looks correct on all device sizes (configured in `app.json` with `logo.png`)
  - [ ] Background color `#a8d97f` is intentional and looks good
  - [ ] Logo is centered and not clipped on any device size
- [ ] **No leftover placeholder assets** — audit `assets/images/` for any `react-logo`, `partial-react-logo`, or default Expo assets still referenced in the app UI

---

## Phase 5: Privacy & Legal

> The app uses `expo-camera` for QR scanning. Depending on what server connections do, additional disclosures may be needed.

- [ ] **Privacy Policy written and hosted** at a public HTTPS URL
  - Must cover: what data is collected, how it's used, who it's shared with, how to delete it, contact info
  - Even if the app collects no personal data, a policy is required
  - Host it on a real domain (not a Google Doc or Notion page — reviewers may flag these)
- [ ] **App Privacy Details completed in App Store Connect** (the "nutrition label")
  - [ ] Declare camera usage (used for QR scanning — not linked to identity, not tracked)
  - [ ] Declare any analytics SDKs (none appear to be included — confirm)
  - [ ] Declare any data sent to servers (chat messages, repo paths, session data sent to user's own server)
  - [ ] Declare AsyncStorage data (server URLs stored locally — this is device storage, not transmitted)
  - If the app only connects to the user's own self-hosted server and collects no analytics, this can be declared as "Data Not Collected"
- [ ] **Terms of Service URL** — add one if the app requires account creation or has paid tiers
- [ ] **No third-party analytics or crash reporting SDKs** included without being declared (check `package.json` — none found currently, but confirm)
- [ ] **Export compliance confirmed** — `ITSAppUsesNonExemptEncryption: false` is already set in `app.json`, which handles this automatically at submission time

---

## Phase 6: App Store Metadata

All of this is entered in App Store Connect under your app record.

### App Information
- [ ] **App Name:** `GRASS` (max 30 characters)
- [ ] **Subtitle:** (optional, max 30 characters) — consider something like "AI coding in your pocket" or "Claude Code on iOS"
- [ ] **Primary Category:** Developer Tools
- [ ] **Secondary Category:** (optional)
- [ ] **Content Rights:** Confirm you own or have rights to all content in the app

### Description
- [ ] **App Description written** (max 4,000 characters)
  - Lead with what the app does and who it's for
  - List key features clearly
  - Do not mention competitor app names
  - Do not include pricing, promotional language, or external URLs
  - Must match what the app actually does — no vaporware features
- [ ] **Promotional Text written** (max 170 characters, optional — can be updated without resubmission)

### Keywords & Discovery
- [ ] **Keywords entered** (max 100 characters total, comma-separated, no spaces after commas)
  - Think: `claude,coding,ai,terminal,ssh,developer,code editor,llm,git,expo`
  - Do not repeat words already in the app name

### Support & Legal URLs
- [ ] **Support URL:** live webpage with contact info or support documentation
- [ ] **Privacy Policy URL:** same as Phase 5 — must be live before submission
- [ ] **Marketing URL:** (optional) your product website

---

## Phase 7: Screenshots

Screenshots are the most visible part of your App Store listing and are required before submission.

### Required Sizes
- [ ] **6.9" iPhone (iPhone 16 Pro Max)** — 1320 x 2868 px — **Required**
- [ ] **6.7" iPhone (iPhone 15 Plus / 16 Plus)** — 1290 x 2796 px
- [ ] **6.5" iPhone (iPhone 11 Pro Max / 12 Pro Max)** — 1242 x 2688 px
- [ ] **5.5" iPhone (iPhone 8 Plus)** — 1242 x 2208 px
- [ ] **12.9" iPad Pro** — 2048 x 2732 px — **Required if `supportsTablet: true`**
- [ ] **11" iPad Pro** — 1668 x 2388 px

> You can use one set for similar sizes. At minimum, you need 6.9" iPhone and 12.9" iPad.

### Content Guidelines (each screenshot)
- [ ] Shows actual app UI — no fake mockups or stock photos
- [ ] Represents the current version of the app (not an older version)
- [ ] No marketing overlay text that makes false claims
- [ ] No Apple device frames (unless Apple-approved frames)
- [ ] Minimum 1, maximum 10 per device size

### Suggested Screens to Capture
- [ ] Home screen (server list)
- [ ] QR code scan screen
- [ ] Repo / folder picker
- [ ] Active chat session with AI response
- [ ] Diff viewer
- [ ] Dark mode variant of at least one screen

### App Preview Video (Optional but Recommended)
- [ ] Up to 3 videos per device size
- [ ] MP4 or MOV, exactly 15–30 seconds, H.264, 30 fps
- [ ] Must represent real app functionality

---

## Phase 8: Age Rating

- [ ] **Age Rating Questionnaire completed** in App Store Connect
  - Navigate to: App → App Information → Age Rating
  - Answer all questions honestly (violence, language, adult content, gambling, etc.)
  - GRASS is expected to be rated **4+** (no objectionable content)

---

## Phase 9: TestFlight Beta Testing

Run a proper beta before submitting for App Store review.

- [ ] **Build uploaded to TestFlight**
  ```bash
  eas build --platform ios --profile production
  eas submit --platform ios
  ```
  Or upload manually in App Store Connect after downloading the IPA.
- [ ] **Internal testers added** (up to 100 App Store Connect users — no review needed)
  - Add anyone on the team with an Apple ID
- [ ] **External testers added** (optional, up to 10,000 — requires beta review ~24hrs)
- [ ] **Beta test information written** in App Store Connect:
  - What to test
  - How to connect to a server
  - Known issues / limitations
  - How to report bugs
- [ ] **Minimum 1 week of testing completed**
- [ ] **All critical bugs and crashes from beta fixed**
- [ ] **Final production build created** after all fixes are in

---

## Phase 10: App Review Information

This is what you enter in App Store Connect when you submit — reviewers read it.

- [ ] **Review Notes written** (max 4,000 characters)
  - Explain that the app requires a GRASS server running somewhere (self-hosted)
  - Provide a demo server URL (or explain how reviewers can test it)
  - Explain the QR scan flow and that it requires a camera
  - Note the light/dark toggle location
  - Explain any screens that require setup before use
  - **This is critical** — if reviewers can't figure out how to use the app, it will be rejected under guideline 2.1

  Example note:
  ```
  GRASS is a mobile client for the GRASS CLI tool, which allows developers to run
  AI coding agents (Claude Code, etc.) from their iPhone. The app connects to a
  GRASS server running on the user's own machine or cloud VM.

  To test: [provide a demo server IP or explain how to set one up, or note it
  requires a companion server that you can provide access to for review].

  The QR scan button on the home screen opens the camera to scan a QR code
  displayed by the GRASS server CLI. Manual IP entry is also supported.
  ```

- [ ] **Demo account / server access provided** (if required for review — highly recommended)
  - If reviewers cannot access a real server, the app may be rejected for incomplete functionality
  - Consider running a public demo server during the review window

---

## Phase 11: Final Pre-Submission Checks

Go through this list the day you submit.

- [ ] `app.json` version and build number are correct
- [ ] All screenshots uploaded and accurate to the current build
- [ ] Privacy Policy URL is live and accessible
- [ ] Support URL is live and accessible
- [ ] App description, keywords, and subtitle are final
- [ ] Age rating questionnaire completed
- [ ] Review notes are written and complete
- [ ] Export compliance: automatically handled by `ITSAppUsesNonExemptEncryption: false`
- [ ] No known crashes in the build being submitted
- [ ] The build being submitted is the same one that passed TestFlight testing

---

## Phase 12: Submission

- [ ] **Submit via EAS** (recommended):
  ```bash
  eas submit --platform ios --profile production
  ```
  This uploads the build and submits it to App Review in App Store Connect.

- [ ] **Or submit manually** in App Store Connect:
  - Go to your app → select the build → click "Add for Review" → Submit to App Review
  - Confirm privacy details, export compliance, advertising ID

- [ ] **Confirmation received** — app status changes to "Waiting for Review"
- [ ] **Review time:** typically 24–48 hours. Monitor App Store Connect and your email.

---

## Phase 13: After Approval

- [ ] **Release strategy chosen**:
  - Automatic: goes live immediately upon approval
  - Manual: you click "Release This Version" in App Store Connect
  - Scheduled: set a date/time in advance
- [ ] **App goes live — verify the App Store listing looks correct**
- [ ] **Monitor crash logs** via Xcode Organizer or a crash reporting tool
- [ ] **Monitor user reviews** and respond in App Store Connect
- [ ] **Plan first update** to address any issues found post-launch

---

## Common Rejection Reasons — Know These Before Submitting

| Guideline | Issue | How to Avoid |
|-----------|-------|--------------|
| 2.1 | App crashes on launch or during review | Test on real devices; provide review notes so reviewers know how to use it |
| 2.1 | Reviewers can't evaluate app (can't connect to server) | Provide a demo server or detailed instructions |
| 4.0 | Copycat or low-quality app | Not applicable — GRASS is a genuine utility |
| 5.1.1 | Missing or inadequate privacy policy | Host a real privacy policy before submitting |
| 2.3.3 | Screenshots don't match app | Keep screenshots current with the build |
| 3.1.1 | App steers users to external payment | Not applicable |
| 1.0 | App metadata is misleading | Ensure description matches actual functionality |
| 4.2 | Incomplete features (placeholder screens) | Remove or hide anything unfinished |

---

## Quick Reference — Key Commands

```bash
# Install / update EAS CLI
npm install -g eas-cli

# Verify login
eas whoami

# Production build (auto-increments build number)
eas build --platform ios --profile production

# Submit to App Store Connect
eas submit --platform ios --profile production

# Check build status
eas build:list --platform ios
```

---

## Useful Links

- App Store Connect: https://appstoreconnect.apple.com
- EAS Build docs: https://docs.expo.dev/build/introduction/
- EAS Submit docs: https://docs.expo.dev/submit/ios/
- App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- App Privacy Details: https://developer.apple.com/app-store/app-privacy-details/
- Screenshot specs: https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications/
- Live review times: https://www.runway.team/appreviewtimes
