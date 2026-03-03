import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';

const interstitialUnitId = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-3940256099942544/1033173712';

export const useInterstitial = (onAdClosed: () => void) => {
    const [interstitial, setInterstitial] = useState<InterstitialAd | null>(null);
    const [adLoaded, setAdLoaded] = useState(false);

    useEffect(() => {
        if (Platform.OS === 'web') return;

        const ad = InterstitialAd.createForAdRequest(interstitialUnitId, {
            requestNonPersonalizedAdsOnly: true,
        });

        const unsubscribeLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
            setAdLoaded(true);
        });

        const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
            onAdClosed();
        });

        ad.load();
        setInterstitial(ad);

        return () => {
            unsubscribeLoaded();
            unsubscribeClosed();
        };
    }, []);

    const showInterstitial = () => {
        if (adLoaded && interstitial) {
            interstitial.show();
        } else {
            onAdClosed();
        }
    };

    return { showInterstitial, adLoaded };
};
