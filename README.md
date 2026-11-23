# ParkingPot

ParkingPot is an Expo and React Native demo app for Android and iOS.

## Run in Expo Go

1. Install dependencies with `npm install`.
2. Start the API server so it listens on `0.0.0.0:8000`, then set `EXPO_PUBLIC_API_BASE_URL` in `.env.local` to `http://<computer Wi-Fi IP>:8000`. Use the computer's current LAN IP, not `localhost` or an old DHCP address.
3. Run `npm start` and scan the QR code with Expo Go. To launch on a connected Android emulator, run `npm run android`.

The home and detail screens render an embedded Kakao JavaScript map in an Expo Go compatible WebView. Add `EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY` to `.env.local` and register `http://localhost` as a JavaScript SDK domain in Kakao Developers. The native app key cannot be used for the JavaScript map SDK. Nearby parking search uses Expo Location and the configured API.
