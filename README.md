# ParkingPot Native

ParkingPot is an Expo and React Native app for iOS and Android. The web/Vite app has been removed.

## Run

1. Set `EXPO_PUBLIC_API_BASE_URL` and `EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY` in `.env.local`.
2. Register the app's native key in Kakao Developers with Android package `com.parkingpot.app` and the development/release signing key hashes. For iOS, register bundle ID `com.parkingpot.app`.
3. Run `npm install`, then `npm run android` or `npm run ios` to build and launch the native development app.
4. Run `npm start` to start Metro for the installed development app.

The Kakao native map SDK is not included in Expo Go; use the development build created by `npm run android` or `npm run ios`. The app uses Expo Router routes under `src/app`, Expo Location for nearby search, and SecureStore for auth and anonymous-session tokens. API calls use the paths from the backend specification.
