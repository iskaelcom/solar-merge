import { Platform } from 'react-native';
import mobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';

export const initAdMob = () => {
    if (Platform.OS !== 'web') {
        // Set global configuration for Families Policy compliance
        mobileAds().setRequestConfiguration({
            // Max rating G (General audience)
            maxAdContentRating: MaxAdContentRating.G,
            // Tag for child-directed treatment (COPPA)
            tagForChildDirectedTreatment: true,
            // Tag for users under the age of consent (GDPR)
            tagForUnderAgeOfConsent: true,
        });

        return mobileAds()
            .initialize()
            .then(adapterStatuses => {
                console.log('AdMob initialized with G rating:', adapterStatuses);
                return adapterStatuses;
            });
    }
    return Promise.resolve({});
};
