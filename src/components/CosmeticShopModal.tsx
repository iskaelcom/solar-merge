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
            <View>
              <Text style={styles.title}>🛍️ Cosmic Boutique</Text>
              <Text style={styles.balance}>💎 {diamonds.toLocaleString()}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabs}>
            <TouchableOpacity style={[styles.tab, tab === 'skins' && styles.activeTab]} onPress={() => setTab('skins')}>
              <Text style={[styles.tabText, tab === 'skins' && styles.activeTabText]}>PLANET SKINS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, tab === 'themes' && styles.activeTab]} onPress={() => setTab('themes')}>
              <Text style={[styles.tabText, tab === 'themes' && styles.activeTabText]}>GALAXY THEMES</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
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
  backdrop: { flex: 1, backgroundColor: 'rgba(3,3,18,0.88)', justifyContent: 'center', alignItems: 'center', padding: 18 },
  card: { width: '100%', maxWidth: 410, maxHeight: '84%', backgroundColor: '#151536', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  header: { padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#FFF', fontSize: 19, fontWeight: '900' },
  balance: { color: '#78E8FF', fontSize: 14, fontWeight: '800', marginTop: 4 },
  close: { color: 'rgba(255,255,255,0.55)', fontSize: 18, fontWeight: '800' },
  tabs: { flexDirection: 'row', paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#00E5FF' },
  tabText: { color: 'rgba(255,255,255,0.42)', fontSize: 11, fontWeight: '800', letterSpacing: 0.7 },
  activeTabText: { color: '#00E5FF' },
  list: { padding: 14, gap: 12 },
  item: { minHeight: 98, padding: 12, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', alignItems: 'center', gap: 12 },
  equippedItem: { borderColor: 'rgba(0,229,255,0.55)', backgroundColor: 'rgba(0,229,255,0.07)' },
  planetPreview: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  themePreview: { width: 72, height: 72, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  themePlanet: { width: 26, height: 26, borderRadius: 13, shadowColor: '#FFF', shadowOpacity: 0.7, shadowRadius: 8, elevation: 5 },
  info: { flex: 1 },
  itemName: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  description: { color: 'rgba(255,255,255,0.52)', fontSize: 11, lineHeight: 15, marginTop: 3 },
  action: { minWidth: 70, borderRadius: 11, paddingHorizontal: 10, paddingVertical: 9, backgroundColor: '#00CFE8', alignItems: 'center' },
  actionText: { color: '#07151C', fontSize: 11, fontWeight: '900' },
  equippedButton: { backgroundColor: 'rgba(0,229,255,0.12)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.28)' },
  equippedText: { color: '#00E5FF', fontSize: 9, fontWeight: '900' },
  disabledButton: { opacity: 0.35 },
});
