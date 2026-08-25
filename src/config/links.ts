// Central place for all store / web links so a URL change never has to be
// hunted down across screens.
//
// The Play Store URL is package-based (details?id=<applicationId>). That URL
// resolves the moment the app goes live on Google Play — no app update or code
// change is needed at Android launch. Until then it simply 404s, which is why
// share copy labels it "coming soon".
export const APP_STORE_URL = 'https://apps.apple.com/app/id6797710095';
export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.thaliplan.app';
export const WEBSITE_URL = 'https://sofra.savvylabs.dev';

// True once the Android app is public on Google Play. Flip to `true` at Android
// launch to switch invite/share copy from "coming soon" to a live link — the URL
// itself never changes.
export const PLAY_STORE_LIVE = false;
