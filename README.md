# ParkingPot

ParkingPot is an Expo and React Native demo app for Android and iOS.

## Run in Expo Go

1. Install dependencies with `npm install`.
2. Set `EXPO_PUBLIC_API_BASE_URL` in `.env.local` to an API address reachable from the phone. For a local server, use the computer's LAN IP address, not `localhost`.
3. Run `npm start` and scan the QR code with Expo Go. To launch on a connected Android emulator, run `npm run android`.

The home screen uses a lightweight demo map illustration so it runs in Expo Go without the Kakao native map SDK. Nearby parking search uses Expo Location and the configured API.
