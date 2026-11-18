# ParkingPot Native

ParkingPot is an Expo and React Native app for iOS and Android. The web/Vite app has been removed.

## Run

1. Set `EXPO_PUBLIC_API_BASE_URL` in `.env.local` to the backend origin.
2. From this project folder run `npm install` and `npm start`.
3. Open the QR code in Expo Go, or use `npm run android` with an Android emulator.

The app uses Expo Router routes under `src/app`, Expo Location for nearby search, and SecureStore for auth and anonymous-session tokens. API calls use the paths from the backend specification.
