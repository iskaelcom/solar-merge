import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const adUnitId = __DEV__ ? TestIds.ADAPTIVE_BANNER : 'ca-app-pub-9833011672001766/7093322964';

export const AdMobBanner = () => {
    const insets = useSafeAreaInsets();
    if (Platform.OS === 'web') return null;

    return (
        <View style={[styles.adContainer, { paddingBottom: Math.max(insets.bottom, 4) }]}>
            <BannerAd
                unitId={adUnitId}
                size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: true,
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    adContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
