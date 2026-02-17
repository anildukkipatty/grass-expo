import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { getUrl } from '@/store/url-store';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    getUrl().then(url => {
      if (url) {
        router.replace('/chat');
      } else {
        router.replace('/settings');
      }
    });
  }, [router]);

  return <View />;
}
