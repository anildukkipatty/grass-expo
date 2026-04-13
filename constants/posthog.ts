import PostHog from 'posthog-react-native'
import { Platform } from 'react-native'

const apiKey = process.env.EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN
const isPostHogConfigured = apiKey && apiKey !== 'phc_your_project_token_here'

export const posthog = new PostHog(apiKey || 'placeholder_key', {
  host: process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
  disabled: !isPostHogConfigured,
  captureAppLifecycleEvents: true,
  flushAt: 20,
  flushInterval: 10000,
  preloadFeatureFlags: true,
})

// Attach platform to every event so mobile vs backend events are distinguishable.
posthog.register({ platform: Platform.OS === 'web' ? 'web' : 'mobile' })
