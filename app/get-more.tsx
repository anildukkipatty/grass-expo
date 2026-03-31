import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { GetMoreSheet } from '@/components/GetMoreSheet';

export default function GetMoreScreen() {
  const router = useRouter();
  const [sheetVisible, setSheetVisible] = useState(false);

  // Open the sheet shortly after the screen mounts so the
  // slide-up animation is visible.
  useEffect(() => {
    const t = setTimeout(() => setSheetVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  function handleClose() {
    setSheetVisible(false);
    setTimeout(() => router.replace('/home'), 300);
  }

  return (
    <View style={styles.container}>
      <GetMoreSheet visible={sheetVisible} onClose={handleClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
