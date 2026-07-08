# PropertyDock Mobile — Release Pipeline (EAS)

End-to-end EAS setup: build profiles, OTA updates, dev/preview/production builds, and
store submission. Commands are in order. **🔴 = needs an action from you** (Apple/Google
account, credentials, or a decision) — I can't do these headlessly.

---

## 0. TL;DR — command order
```bash
npm i -g eas-cli            # or prefix every command with `npx`
eas login                   # 🔴 Expo account
eas init                    # 🔴 creates the project; writes extra.eas.projectId + owner to app.json
eas update:configure        # installs expo-updates, sets updates.url + runtimeVersion + channels

# Development build on a real device (native modules: push, biometrics, maps)
eas build --profile development --platform ios      # and/or android
npx expo start --dev-client                          # serve JS to the installed dev client

# Preview build for testers (internal distribution)
eas build --profile preview --platform android       # and/or ios

# OTA JS update (no store round-trip)
eas update --channel preview    --message "Fix inquiry form"
eas update --channel production --message "Copy tweak"

# Production build + store submit
eas build  --profile production --platform all
eas submit --profile production --platform ios        # 🔴 App Store Connect app + creds
eas submit --profile production --platform android    # 🔴 Play Console app + service account
```

---

## 1. Prerequisites & account actions 🔴
| # | Action | Notes |
|---|---|---|
| 1 | **Expo account** + `eas login` | Free. `eas init` links this repo to an EAS project. |
| 2 | **Apple Developer Program** ($99/yr) | Needed for device dev builds, TestFlight, and the App Store. Gives you an **Apple Team ID**. |
| 3 | **App Store Connect app record** | Create the app once (bundle id `app.propertydock.mobile`). Gives the **ascAppId**. EAS can register the bundle id + manage certs/provisioning for you. |
| 4 | **Apple push key (APNs)** | EAS auto-creates/manages it during the first iOS build — just approve when prompted. |
| 5 | **Google Play Developer account** ($25 once) | Create the app in Play Console (package `app.propertydock.mobile`). |
| 6 | **Play service account JSON** | Play Console → Setup → API access → create a service account with "Release" permission → download JSON → save to `./secrets/google-play-service-account.json` (gitignored). Powers `eas submit`. |
| 7 | **Android FCM v1 key** | Required for **push to Android devices**. Create a Firebase project, add an Android app (`app.propertydock.mobile`), upload the FCM v1 service account to EAS (`eas credentials`). |
| 8 | **Real API domains** | Replace the staging/prod hosts in `eas.json` (`https://staging-api.propertydock.app`, `https://api.propertydock.app`) with your actual URLs. |
| 9 | **Privacy Policy URL** | Required by **both** stores. Host one (can reuse the web policy). |

Fill the placeholders in `eas.json` → `submit.production.ios` (`appleId`, `ascAppId`,
`appleTeamId`).

---

## 2. What's already configured in this repo
**`eas.json`** — three profiles, each with its own API URL + EAS Update channel:

| Profile | Distribution | Channel | `EXPO_PUBLIC_API_URL` | Version bump |
|---|---|---|---|---|
| `development` | internal (dev client) | `development` | `http://localhost:5000` | — |
| `preview` | internal (APK / ad-hoc) | `preview` | `https://staging-api.propertydock.app` | — |
| `production` | store | `production` | `https://api.propertydock.app` | `autoIncrement` |

> **Dev + device caveat:** `eas.json` `env` bakes the URL into the *binary*, but a dev
> build loads JS from your local Metro, which uses **its own** `process.env` /`.env`.
> `localhost` also won't resolve from a physical device. For device dev, run Metro with
> `EXPO_PUBLIC_API_URL=http://<your-LAN-IP>:5000 npx expo start --dev-client` (or point at
> staging).

**`app.json`** — `ios.bundleIdentifier` + `android.package` = `app.propertydock.mobile`,
`version` `1.0.0`, `runtimeVersion.policy = "appVersion"`, scheme `propertydockmobile`,
universal-link config (`applinks:propertydock.app` / Android intent filter), and the
config plugins for notifications, secure-store, and Face ID.

`appVersionSource: "remote"` (in `eas.json`) means **EAS owns build numbers** —
`autoIncrement` bumps `ios.buildNumber` / `android.versionCode` on every production build,
so you never edit them by hand. Bump the marketing **`version`** in `app.json` only for
user-facing releases.

---

## 3. App icon & splash 🔴 (design deliverable)
Modern EAS builds generate the full icon set from source images — you don't hand-cut every
size. Replace the template placeholders:

| Asset | File | Spec |
|---|---|---|
| iOS + base icon | `assets/images/icon.png` | **1024×1024 PNG, no transparency, no rounded corners** (Apple rounds it). |
| Android adaptive foreground | `assets/images/android-icon-foreground.png` | 1024×1024, logo centered in the safe ~66% (outer edges get cropped by the mask). |
| Android adaptive background | set in `app.json` `android.adaptiveIcon.backgroundColor` (currently `#E6F4FE`) | Use the brand navy or a light tint. |
| Splash | `assets/images/splash-icon.png` + `expo-splash-screen` plugin (bg `#208AEF`) | Center logo on a solid brand color. Add a `dark` variant for dark mode if desired. |

Source art: the web brand logos live at
`PropertyDockFrontend/public/assets/images/logos/{blue-logo,white-logo}.png`. Brand color
is navy `hsl(213 100% 12%)`; the current splash uses `#208AEF` — align these with design.
I did **not** fabricate icon art — drop in the 1024 icon and rebuild; no code change needed.

---

## 4. One-time EAS setup
```bash
eas login                 # 🔴
eas init                  # writes extra.eas.projectId + owner into app.json — commit that
eas update:configure      # installs expo-updates, adds updates.url, wires channels
```
Commit the `app.json` changes `eas init` makes (projectId/owner) — they're required for
builds and OTA.

---

## 5. EAS Update (OTA JS updates)
Channels are already declared per profile in `eas.json`. Each build "listens" on its
channel; `eas update --channel <name>` publishes a new JS bundle to every build on it.

```bash
eas update --channel development --message "…"   # dev clients
eas update --channel preview     --message "…"   # tester builds
eas update --channel production  --message "…"   # live app
```
- **`runtimeVersion.policy = "appVersion"`**: an OTA update only reaches builds whose app
  version matches. **Bump `version` and ship a new store build** whenever you change native
  code/config (new module, permission, plugin). JS/asset-only changes → OTA is fine.
- Roll back: `eas update --channel production --message "rollback" --republish` (or
  re-publish a previous update from the dashboard).

---

## 6. Development build (real device, with native modules) 🔴 device
Needed because push, biometrics, and maps don't run in Expo Go.
```bash
# iOS (needs Apple account; EAS handles certs/provisioning interactively)
eas build --profile development --platform ios
# Android (produces an installable .apk)
eas build --profile development --platform android
```
- iOS: register the device when prompted (`eas device:create`) for ad-hoc provisioning, or
  use a simulator build with `"ios": { "simulator": true }`.
- Install the finished build from the EAS link (Android: download the APK; iOS: install via
  the QR / TestFlight-style link).
- Then serve JS: `npx expo start --dev-client` (set `EXPO_PUBLIC_API_URL` in your shell as
  noted in §2). The dev client hot-reloads like Expo Go but includes the native modules.

---

## 7. Preview build (internal distribution for testers) 🔴 device
```bash
eas build --profile preview --platform android    # APK, sideloadable
eas build --profile preview --platform ios         # ad-hoc (registered devices) or TestFlight
```
- Share the EAS build URL with testers. Android testers install the APK directly; iOS
  testers must have their device UDID registered (`eas device:create`) unless you route iOS
  previews through **TestFlight** (`--profile production` + `eas submit` to TestFlight is the
  smoother iOS tester path).
- Points at **staging** (`https://staging-api.propertydock.app`).
- Push JS-only fixes to testers instantly: `eas update --channel preview -m "…"`.

---

## 8. Production build
```bash
eas build --profile production --platform all
```
Produces store-ready artifacts (iOS `.ipa`, Android `.aab`) signed with EAS-managed
credentials, pointing at prod, with an auto-incremented build number.

---

## 9. Store submission

### 9a. App Store Connect (iOS) 🔴
1. Create the app record (bundle id `app.propertydock.mobile`), set **category** (Lifestyle
   or a Real-Estate-adjacent one), **content rating**, **privacy policy URL**, **support URL**.
2. **App Privacy** questionnaire — declare per the table in §10.
3. **Encryption compliance**: the app uses only standard HTTPS → set
   `ITSAppUsesNonExemptEncryption=false` (add to `app.json` `ios.infoPlist`) to skip the
   export-compliance prompt each build.
4. **Screenshots** (upload in ASC):
   - iPhone **6.9"/6.7"**: **1290×2796** (required).
   - iPad **12.9"/13"**: **2048×2732** (required only if the app is offered on iPad; it is by
     default — either provide them or disable iPad in `app.json` `ios`).
5. **Metadata**: name (≤30), subtitle (≤30), promo text (≤170), description (≤4000),
   keywords (≤100), demo account for review (a verified test login — reviewers can't verify
   email themselves).
6. Submit:
   ```bash
   eas submit --profile production --platform ios
   ```

### 9b. Google Play (Android) 🔴
1. Create the app (package `app.propertydock.mobile`); complete **Data safety**, **content
   rating** questionnaire, **target audience**, **app access** (provide demo login),
   **privacy policy URL**.
2. **Store listing**: app name (≤30), short description (≤80), full description (≤4000),
   **feature graphic 1024×500**, **icon 512×512** (32-bit PNG), phone screenshots (2–8,
   9:16, min side ≥320px), optional 7"/10" tablet shots.
3. First upload sometimes must be done manually to the **internal testing** track; after
   that `eas submit` works. Service account JSON at `./secrets/google-play-service-account.json`.
   ```bash
   eas submit --profile production --platform android
   ```

---

## 10. Permissions → store data-safety declarations
**Be accurate to what's actually shipped.** Today the app requests only **push
notifications** and **biometrics**. Camera/photos apply once the list-a-property wizard +
verification upload land; location has a maps caveat. Declare only what the installed build
actually contains.

| Permission | Status in app | Module | iOS App Privacy | Google Play Data safety |
|---|---|---|---|---|
| **Push notifications** | ✅ active | `expo-notifications` | Identifiers → *Device ID / push token*, "App functionality", linked to user | Collected: device/push token; purpose "App functionality / Messaging" |
| **Biometrics (Face ID / fingerprint)** | ✅ active | `expo-local-authentication` | **Not collected** — on-device auth only, nothing leaves the device | **Not collected/shared** — on-device only |
| **Account data** (email, name, phone) | ✅ active | your API | Contact info → collected, linked, "App functionality" | Personal info (name, email, phone) collected, "Account management" |
| **User content** (listings, inquiries) | ✅ active | your API | User content → collected, linked | "App activity" / user-generated content |
| **Camera + Photo library** | ⏳ pending | (needs `expo-image-picker`; wizard/verification not built yet) | Declare *Photos* when shipped; add `NSCameraUsageDescription` + `NSPhotoLibraryUsageDescription` | Declare "Photos/Videos" when shipped |
| **Location** | ⚠️ see note | not used by our code | Only declare if you enable it | Only declare if the manifest ships location perms |

> ⚠️ **Location gotcha:** `react-native-maps` can inject `ACCESS_FINE_LOCATION` /
> `ACCESS_COARSE_LOCATION` into the merged Android manifest even though we never request the
> user's location (we don't set `showsUserLocation`). **Verify the built manifest**
> (`eas build` → expand the Android build, or run `npx expo prebuild` and check
> `android/app/src/main/AndroidManifest.xml`). If the perms are present you must **either**
> declare location in Play Data safety **or** strip them via an `expo-build-properties` /
> manifest override (`tools:node="remove"`). Don't ship an undeclared location permission —
> Play will reject it.

Runtime UX for these is already handled in-app (rationale + graceful denied fallback for
push and biometrics — see the native-capabilities work).

---

## 11. Release cadence — OTA vs new build
| Change | Ship via |
|---|---|
| JS logic, styles, copy, images/assets | **`eas update`** (instant, same app version) |
| New native module, permission, config-plugin, SDK bump, `app.json` native field | **New store build** (bump `version`, `eas build`, `eas submit`) |

---

## 12. Still-open items for you
- 🔴 Run `eas init` + `eas update:configure` (writes projectId/owner + updates.url — I left those to the CLI so nothing is faked).
- 🔴 Replace API domains in `eas.json`, submit placeholders in `eas.json`, and the icon art.
- 🔴 Apple + Google account setup, FCM key for Android push, privacy policy URL.
- ⚠️ Resolve the `react-native-maps` Android location-permission question before the Play submission.
