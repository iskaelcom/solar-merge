import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';

const adUnitId = __DEV__
  ? TestIds.INTERSTITIAL
  : 'ca-app-pub-3940256099942544/1033173712';

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

export function preloadInterstitial() {
  if (!isLoaded) {
    ad.load();
  }
}

export function showInterstitialAd() {
  if (isLoaded) {
    ad.show();
  } else {
    ad.load(); // not ready yet, load for next time
  }
}
