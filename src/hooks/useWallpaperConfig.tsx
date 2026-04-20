import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type WallpaperMode = 'random' | 'sequential' | 'fixed';
export type BackgroundType = 'wallpaper' | 'aurora' | 'default';

export interface AuroraPreset {
  id: string;
  name: string;
  colors: string[];
}

export const AURORA_PRESETS: AuroraPreset[] = [
  { id: 'arctic', name: 'Ártico', colors: ['#0ea5e9', '#06b6d4', '#22d3ee', '#67e8f9'] },
  { id: 'forest', name: 'Bosque', colors: ['#22c55e', '#16a34a', '#4ade80', '#86efac'] },
  { id: 'sunset', name: 'Atardecer', colors: ['#f97316', '#fb923c', '#fbbf24', '#fcd34d'] },
  { id: 'twilight', name: 'Crepúsculo', colors: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'] },
  { id: 'rose', name: 'Rosa', colors: ['#ec4899', '#f472b6', '#fb7185', '#fda4af'] },
  { id: 'ocean', name: 'Océano', colors: ['#0d9488', '#14b8a6', '#2dd4bf', '#5eead4'] },
  { id: 'fire', name: 'Fuego', colors: ['#dc2626', '#ef4444', '#f97316', '#fb923c'] },
  { id: 'aurora-green', name: 'Aurora Verde', colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'] },
];

export const DEFAULT_WALLPAPERS = [
  '/images/wallpapers/photo-1563089145-599997674d42.jpg',
  '/images/wallpapers/photo-1439792675105-701e6a4ab6f0.jpg',
  '/images/wallpapers/photo-1445855743215-296f71d4b49c.jpg',
  '/images/wallpapers/photo-1445964047600-cdbdb873673d.jpg',
  '/images/wallpapers/photo-1447014421976-7fec21d26d86.jpg',
  '/images/wallpapers/photo-1461696114087-397271a7aedc.jpg',
  '/images/wallpapers/photo-1470093851219-69951fcbb533.jpg',
  '/images/wallpapers/photo-1470217957101-da7150b9b681.jpg',
  '/images/wallpapers/photo-1475257026007-0753d5429e10.jpg',
  '/images/wallpapers/photo-1476673160081-cf065607f449.jpg',
  '/images/wallpapers/photo-1484903079635-f63c02f8b149.jpg',
  '/images/wallpapers/photo-1489782419474-4d4221dc5b10.jpg',
  '/images/wallpapers/photo-1491900177661-4e1cd2d7cce2.jpg',
  '/images/wallpapers/photo-1493585552824-131927c85da2.jpg',
  '/images/wallpapers/photo-1494564256121-aada9f29f988.jpg',
  '/images/wallpapers/photo-1496661274775-a86a124b9df3.jpg',
  '/images/wallpapers/photo-1498588543704-e0d466ddcfe5.jpg',
  '/images/wallpapers/photo-1498931299472-f7a63a5a1cfa.jpg',
  '/images/wallpapers/photo-1500964757637-c85e8a162699.jpg',
  '/images/wallpapers/photo-1501854140801-50d01698950b.jpg',
  '/images/wallpapers/photo-1505761671935-60b3a7427bad.jpg',
  '/images/wallpapers/photo-1519681393784-d120267933ba.jpg',
  '/images/wallpapers/photo-1518173946687-a4c8892bbd9f.jpg',
  '/images/wallpapers/photo-1507525428034-b723cf961d3e.jpg',
  '/images/wallpapers/photo-1469474968028-56623f02e42e.jpg',
  '/images/wallpapers/photo-1506905925346-21bda4d32df4.jpg',
  '/images/wallpapers/photo-1464822759023-fed622ff2c3b.jpg',
  '/images/wallpapers/photo-1470252649378-9c29740c9fa8.jpg',
  '/images/wallpapers/photo-1472214103451-9374bd1c798e.jpg',
  '/images/wallpapers/photo-1504198453319-5ce911bafcde.jpg',
  '/images/wallpapers/photo-1510797215324-95aa89f3c22d.jpg',
  '/images/wallpapers/photo-1511884642898-4c92249e20b6.jpg',
  '/images/wallpapers/photo-1507400492013-162705c10e8f.jpg',
  '/images/wallpapers/photo-1502786129293-79981df4e689.jpg',
  '/images/wallpapers/photo-1527489377706-5bf97e608852.jpg',
  '/images/wallpapers/photo-1465146344425-f00d5f5c8f07.jpg',
  '/images/wallpapers/photo-1430778569142-43551f375f9a.jpg',
];

export const DEFAULT_CONFIG = {
  backgroundType: 'wallpaper' as BackgroundType,
  wallpaperMode: 'random' as WallpaperMode,
  fixedWallpaper: DEFAULT_WALLPAPERS[0],
  fixedAuroraPreset: 'arctic',
  opacity: 70,
  blur: 8,
  brightness: 100,
  saturation: 100,
  auroraIntensity: 60,
  auroraSpeed: 15,
};

interface WallpaperConfig {
  backgroundType: BackgroundType;
  wallpaperMode: WallpaperMode;
  fixedWallpaper: string;
  fixedAuroraPreset: string;
  opacity: number;
  blur: number;
  brightness: number;
  saturation: number;
  auroraIntensity: number;
  auroraSpeed: number;
}

interface WallpaperContextType {
  config: WallpaperConfig;
  setConfig: (config: WallpaperConfig) => void;
  updateConfig: (updates: Partial<WallpaperConfig>) => void;
  resetConfig: () => void;
  wallpapers: string[];
  customWallpapers: string[];
  addCustomWallpaper: (wallpaper: string) => void;
  removeCustomWallpaper: (wallpaper: string) => void;
  getCurrentBackground: () => string;
  getOverlayStyle: () => React.CSSProperties;
  refreshWallpapers: () => void;
  currentWallpaperIndex: number;
  setCurrentWallpaperIndex: (index: number) => void;
}

const STORAGE_KEY = 'sge-wallpaper-config';
const SEQUENTIAL_INDEX_KEY = 'sge-wallpaper-sequential-index';
const CUSTOM_WALLPAPERS_KEY = 'sge-custom-wallpapers';

function getDefaultWallpaper(): string {
  return DEFAULT_WALLPAPERS[0] || '/images/wallpapers/default.jpg';
}

function loadConfigFromStorage(): WallpaperConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load wallpaper config:', e);
  }
  return { ...DEFAULT_CONFIG };
}

function loadCustomWallpapers(): string[] {
  try {
    const stored = localStorage.getItem(CUSTOM_WALLPAPERS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load custom wallpapers:', e);
  }
  return [];
}

function saveConfigToStorage(config: WallpaperConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save wallpaper config:', e);
  }
}

function saveCustomWallpapers(wallpapers: string[]): void {
  try {
    localStorage.setItem(CUSTOM_WALLPAPERS_KEY, JSON.stringify(wallpapers));
  } catch (e) {
    console.warn('Failed to save custom wallpapers:', e);
  }
}

const WallpaperContext = createContext<WallpaperContextType | null>(null);

export function WallpaperProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<WallpaperConfig>(loadConfigFromStorage);
  const [wallpapers, setWallpapers] = useState<string[]>(DEFAULT_WALLPAPERS);
  const [customWallpapers, setCustomWallpapers] = useState<string[]>(loadCustomWallpapers);
  const [sequentialIndex, setSequentialIndex] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem(SEQUENTIAL_INDEX_KEY) || '0', 10);
    } catch {
      return 0;
    }
  });

  const refreshWallpapers = useCallback(() => {
    setWallpapers(DEFAULT_WALLPAPERS);
  }, []);

  const setConfig = useCallback((newConfig: WallpaperConfig) => {
    setConfigState(newConfig);
    saveConfigToStorage(newConfig);
  }, []);

  const updateConfig = useCallback((updates: Partial<WallpaperConfig>) => {
    setConfig({ ...config, ...updates });
  }, [config, setConfig]);

  const resetConfig = useCallback(() => {
    setConfig({ ...DEFAULT_CONFIG });
  }, [setConfig]);

  const addCustomWallpaper = useCallback((wallpaper: string) => {
    setCustomWallpapers(prev => {
      if (prev.includes(wallpaper)) return prev;
      const updated = [...prev, wallpaper];
      saveCustomWallpapers(updated);
      return updated;
    });
  }, []);

  const removeCustomWallpaper = useCallback((wallpaper: string) => {
    setCustomWallpapers(prev => {
      const updated = prev.filter(w => w !== wallpaper);
      saveCustomWallpapers(updated);
      return updated;
    });
  }, []);

  const allWallpapers = [...wallpapers, ...customWallpapers];

  const getCurrentBackground = useCallback((): string => {
    if (config.backgroundType === 'default') {
      return 'default:glass';
    }

    if (config.backgroundType === 'aurora') {
      const preset = AURORA_PRESETS.find(p => p.id === config.fixedAuroraPreset) || AURORA_PRESETS[0];
      return `aurora:${preset.id}`;
    }

    if (allWallpapers.length === 0) {
      return getDefaultWallpaper();
    }

    switch (config.wallpaperMode) {
      case 'fixed':
        if (allWallpapers.includes(config.fixedWallpaper)) {
          return config.fixedWallpaper;
        }
        return allWallpapers[0] || getDefaultWallpaper();
      case 'sequential':
        const idx = sequentialIndex % allWallpapers.length;
        return allWallpapers[idx] || getDefaultWallpaper();
      case 'random':
      default:
        return allWallpapers[Math.floor(Math.random() * allWallpapers.length)] || getDefaultWallpaper();
    }
  }, [config, allWallpapers, sequentialIndex]);

  const advanceSequentialIndex = useCallback(() => {
    if (allWallpapers.length > 0) {
      const newIndex = (sequentialIndex + 1) % allWallpapers.length;
      setSequentialIndex(newIndex);
      localStorage.setItem(SEQUENTIAL_INDEX_KEY, String(newIndex));
    }
  }, [sequentialIndex, allWallpapers.length]);

  useEffect(() => {
    advanceSequentialIndex();
  }, [allWallpapers.length]);

  const getOverlayStyle = useCallback((): React.CSSProperties => {
    const { opacity, blur, brightness, saturation, auroraIntensity } = config;
    return {
      '--overlay-opacity': opacity / 100,
      '--overlay-blur': `${blur}px`,
      '--overlay-brightness': brightness / 100,
      '--overlay-saturation': saturation / 100,
      '--aurora-intensity': auroraIntensity / 100,
    } as React.CSSProperties;
  }, [config]);

  const value: WallpaperContextType = {
    config,
    setConfig,
    updateConfig,
    resetConfig,
    wallpapers: allWallpapers,
    customWallpapers,
    addCustomWallpaper,
    removeCustomWallpaper,
    getCurrentBackground,
    getOverlayStyle,
    refreshWallpapers,
    currentWallpaperIndex: sequentialIndex,
    setCurrentWallpaperIndex: (index: number) => {
      setSequentialIndex(index);
      localStorage.setItem(SEQUENTIAL_INDEX_KEY, String(index));
    },
  };

  return (
    <WallpaperContext.Provider value={value}>
      {children}
    </WallpaperContext.Provider>
  );
}

export function useWallpaperConfig(): WallpaperContextType {
  const context = useContext(WallpaperContext);
  if (!context) {
    return {
      config: { ...DEFAULT_CONFIG },
      setConfig: () => {},
      updateConfig: () => {},
      resetConfig: () => {},
      wallpapers: DEFAULT_WALLPAPERS,
      customWallpapers: [],
      addCustomWallpaper: () => {},
      removeCustomWallpaper: () => {},
      getCurrentBackground: () => getDefaultWallpaper(),
      getOverlayStyle: () => ({}),
      refreshWallpapers: () => {},
      currentWallpaperIndex: 0,
      setCurrentWallpaperIndex: () => {},
    };
  }
  return context;
}

export function getAuroraPreset(presetId: string): AuroraPreset {
  return AURORA_PRESETS.find(p => p.id === presetId) || AURORA_PRESETS[0];
}
