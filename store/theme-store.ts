import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';

const THEME_KEY = 'grass_theme';

export type Theme = 'light' | 'dark';

let _theme: Theme = 'light';
let _listeners: Array<(t: Theme) => void> = [];

function notifyListeners() {
  _listeners.forEach(fn => fn(_theme));
}

export async function initTheme(): Promise<Theme> {
  const stored = await AsyncStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') {
    _theme = stored;
    notifyListeners();
  }
  return _theme;
}

export async function setTheme(t: Theme): Promise<void> {
  _theme = t;
  await AsyncStorage.setItem(THEME_KEY, t);
  notifyListeners();
}

export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setLocalTheme] = useState<Theme>(_theme);

  useEffect(() => {
    const listener = (t: Theme) => setLocalTheme(t);
    _listeners.push(listener);
    // Load from storage on first use
    initTheme();
    return () => {
      _listeners = _listeners.filter(fn => fn !== listener);
    };
  }, []);

  const toggle = useCallback((t: Theme) => {
    setTheme(t);
  }, []);

  return [theme, toggle];
}
