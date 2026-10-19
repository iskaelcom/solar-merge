import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  GALAXY_THEMES,
  GalaxyThemeId,
  PLANET_SKINS,
  PlanetSkinId,
} from '../constants/cosmetics';
import { PlanetThumb } from './PlanetView';

interface Props {
  visible: boolean;
  onClose: () => void;
  diamonds: number;
  ownedPlanetSkins: PlanetSkinId[];
  equippedPlanetSkin: PlanetSkinId;
  ownedGalaxyThemes: GalaxyThemeId[];
  equippedGalaxyTheme: GalaxyThemeId;
  onPurchasePlanetSkin: (id: PlanetSkinId) => boolean;
  onEquipPlanetSkin: (id: PlanetSkinId) => boolean;
  onPurchaseGalaxyTheme: (id: GalaxyThemeId) => boolean;
  onEquipGalaxyTheme: (id: GalaxyThemeId) => boolean;
}

export function CosmeticShopModal({
  visible,
  onClose,
  diamonds,
  ownedPlanetSkins,
  equippedPlanetSkin,
  ownedGalaxyThemes,
  equippedGalaxyTheme,
  onPurchasePlanetSkin,
  onEquipPlanetSkin,
  onPurchaseGalaxyTheme,
  onEquipGalaxyTheme,
}: Props) {
  const [tab, setTab] = useState<'skins' | 'themes'>('skins');

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>🛍️  Cosmic Boutique</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>PURCHASE</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceIcon}>💎</Text>
              <Text style={styles.balanceLabel}>Your Diamonds</Text>
              <Text style={styles.balance}>{diamonds.toLocaleString()}</Text>
            </View>

            <View style={styles.tabs}>
              <TouchableOpacity style={[styles.tab, tab === 'skins' && styles.activeTab]} onPress={() => setTab('skins')}>
                <Text style={[styles.tabText, tab === 'skins' && styles.activeTabText]}>PLANET SKINS</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tab, tab === 'themes' && styles.activeTab]} onPress={() => setTab('themes')}>
                <Text style={[styles.tabText, tab === 'themes' && styles.activeTabText]}>GALAXY THEMES</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>{tab === 'skins' ? 'AVAILABLE SKINS' : 'AVAILABLE THEMES'}</Text>
            {tab === 'skins' ? PLANET_SKINS.map((skin) => {
              const owned = ownedPlanetSkins.includes(skin.id);
              const equipped = equippedPlanetSkin === skin.id;
              return (
                <View key={skin.id} style={[styles.item, equipped && styles.equippedItem]}>
                  <View style={styles.planetPreview}>
                    <PlanetThumb planetId={skin.previewPlanetId} size={66} skinId={skin.id} />
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.itemName}>{skin.name}</Text>
                    <Text style={styles.description}>{skin.description}</Text>
                  </View>
                  <ShopButton
                    owned={owned}
                    equipped={equipped}
                    price={skin.price}
                    affordable={diamonds >= skin.price}
                    onPress={() => owned ? onEquipPlanetSkin(skin.id) : onPurchasePlanetSkin(skin.id)}
                  />
                </View>
              );
            }) : GALAXY_THEMES.map((theme) => {
              const owned = ownedGalaxyThemes.includes(theme.id);
              const equipped = equippedGalaxyTheme === theme.id;
              return (
                <View key={theme.id} style={[styles.item, equipped && styles.equippedItem]}>
                  <LinearGradient colors={[...theme.gradient]} style={styles.themePreview}>
                    <Text style={{ color: theme.starColor, fontSize: 20 }}>✦</Text>
                    <View style={[styles.themePlanet, { backgroundColor: theme.accentColor }]} />
                  </LinearGradient>
                  <View style={styles.info}>
                    <Text style={styles.itemName}>{theme.name}</Text>
                    <Text style={styles.description}>{theme.description}</Text>
                  </View>
                  <ShopButton
                    owned={owned}
                    equipped={equipped}
                    price={theme.price}
                    affordable={diamonds >= theme.price}
                    onPress={() => owned ? onEquipGalaxyTheme(theme.id) : onPurchaseGalaxyTheme(theme.id)}
                  />
                </View>
              );
            })}
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ShopButton({ owned, equipped, price, affordable, onPress }: {
  owned: boolean;
  equipped: boolean;
  price: number;
  affordable: boolean;
  onPress: () => void;
}) {
  if (equipped) {
    return <View style={[styles.action, styles.equippedButton]}><Text style={styles.equippedText}>EQUIPPED</Text></View>;
  }
  return (
    <TouchableOpacity
      style={[styles.action, !owned && !affordable && styles.disabledButton]}
      disabled={!owned && !affordable}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={styles.actionText}>{owned ? 'EQUIP' : `${price} 💎`}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(5, 5, 20, 0.82)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 390, maxHeight: '80%', backgroundColor: '#16163a', borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  title: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  close: { color: 'rgba(255,255,255,0.45)', fontSize: 16, fontWeight: '700' },
  body: { paddingVertical: 8 },
  sectionLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  balanceIcon: { fontSize: 18, width: 30 },
  balanceLabel: { flex: 1, color: '#e0e0f0', fontSize: 15 },
  balance: { color: '#00E5FF', fontSize: 15, fontWeight: '800' },
  tabs: { flexDirection: 'row', marginTop: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#00E5FF' },
  tabText: { color: 'rgba(255,255,255,0.42)', fontSize: 11, fontWeight: '800', letterSpacing: 0.7 },
  activeTabText: { color: '#00E5FF' },
  item: { minHeight: 94, paddingHorizontal: 20, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', flexDirection: 'row', alignItems: 'center', gap: 12 },
  equippedItem: { backgroundColor: 'rgba(0,229,255,0.055)' },
  planetPreview: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  themePreview: { width: 72, height: 72, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  themePlanet: { width: 26, height: 26, borderRadius: 13, shadowColor: '#FFF', shadowOpacity: 0.7, shadowRadius: 8, elevation: 5 },
  info: { flex: 1 },
  itemName: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  description: { color: 'rgba(255,255,255,0.52)', fontSize: 11, lineHeight: 15, marginTop: 3 },
  action: { minWidth: 70, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: '#7c6fff', alignItems: 'center' },
  actionText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  equippedButton: { backgroundColor: 'rgba(0,229,255,0.12)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.28)' },
  equippedText: { color: '#00E5FF', fontSize: 9, fontWeight: '900' },
  disabledButton: { opacity: 0.35 },
});
