# ParkingPot

ParkingPot is an Expo and React Native demo app for Android and iOS.

## Run in Expo Go

1. Install dependencies with `npm install`.
2. Start the API server so it listens on `0.0.0.0:8000`, then set `EXPO_PUBLIC_API_BASE_URL` in `.env.local` to `http://<computer Wi-Fi IP>:8000`. Use the computer's current LAN IP, not `localhost` or an old DHCP address.
3. Run `npm start` and scan the QR code with Expo Go. To launch on a connected Android emulator, run `npm run android`.

The home screen displays Kakao Map's web map in an Expo Go compatible WebView, centered on the device location. Nearby parking search uses Expo Location and the configured API.
