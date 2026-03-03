import { Platform } from 'react-native';
import mobileAds from 'react-native-google-mobile-ads';

export const initAdMob = () => {
    if (Platform.OS !== 'web') {
        return mobileAds()
            .initialize()
            .then(adapterStatuses => {
                console.log('AdMob initialized:', adapterStatuses);
                return adapterStatuses;
            });
    }
    return Promise.resolve({});
};
