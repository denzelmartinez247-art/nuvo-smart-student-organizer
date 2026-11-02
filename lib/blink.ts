import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, AsyncStorageAdapter } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: process.env.EXPO_PUBLIC_BLINK_PROJECT_ID || 'nuvo-mobile-organizer-o7l5pnnb',
  publishableKey: process.env.EXPO_PUBLIC_BLINK_PUBLISHABLE_KEY || 'blnk_pk_4g2XZDicDr8wb4aNBBzvUCgXZ4dE5_qL',
  authRequired: false,
  auth: { mode: 'headless', webBrowser: WebBrowser, linking: Linking },
  storage: new AsyncStorageAdapter(AsyncStorage),
})
