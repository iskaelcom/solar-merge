export const useInterstitial = (onAdClosed: () => void) => {
    const showInterstitial = () => {
        onAdClosed();
    };

    return { showInterstitial, adLoaded: false };
};
