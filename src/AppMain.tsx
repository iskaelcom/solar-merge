import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GameScreen } from './components/GameScreen';
import { initAdMob } from './utils/AdMobManager';
import { AdMobBanner } from './components/AdMobBanner';

export default function AppMain() {
    useEffect(() => {
        initAdMob();
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.gameContainer}>
                <GameScreen />
            </View>
            <AdMobBanner />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a2e',
    },
    gameContainer: {
        flex: 1,
    },
});
