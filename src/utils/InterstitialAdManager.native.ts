import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';

const adUnitId = __DEV__
  ? TestIds.INTERSTITIAL
  : 'ca-app-pub-9833011672001766/7428219091';

let ad = InterstitialAd.createForAdRequest(adUnitId, {
  requestNonPersonalizedAdsOnly: true,
});
let isLoaded = false;

ad.addAdEventListener(AdEventType.LOADED, () => {
  isLoaded = true;
});

ad.addAdEventListener(AdEventType.CLOSED, () => {
  isLoaded = false;
  ad.load(); // preload for next game over
});

ad.addAdEventListener(AdEventType.ERROR, () => {
  isLoaded = false;
});

// Preload immediately on first import
ad.load();

export function showInterstitialAd() {
  if (isLoaded) {
    ad.show();
  } else {
    ad.load(); // not ready, load for next time
  }
}
