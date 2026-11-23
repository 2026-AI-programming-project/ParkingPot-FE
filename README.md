# ParkingPot

Expo Router와 React Native로 만든 Android/iOS 주차장 앱입니다.

## 시작하기

1. `npm install`로 패키지를 설치합니다.
2. `.env.example`을 복사해 `.env.local`을 만들고 API 주소와 Kakao JavaScript 키를 설정합니다.
3. API 서버를 `0.0.0.0:8000`에서 실행합니다. 실제 휴대폰에서 테스트할 때 API 주소는 `localhost` 대신 개발 PC의 현재 Wi-Fi IP를 사용합니다.
4. `npm start`로 Expo Go 개발 서버를 시작합니다.

정적 검사:

- `npm run lint`
- `npm run typecheck`

## 코드 구조

```text
src/
  app/                 Expo Router route files and layouts
  components/          Shared UI components
  context/             Auth and favorites providers
  features/
    auth/              Sign-in and sign-up screen
    favorites/         Saved parking screens
    parking/           Search, detail, map and parking API
    profile/           Account screen and profile API
  lib/                 Shared API client and response helpers
```

Kakao 지도는 Expo Go와 호환되는 WebView JavaScript SDK를 사용합니다. Kakao Developers에서 `http://localhost`를 JavaScript SDK 도메인으로 등록해야 합니다. 앱에 포함되는 `EXPO_PUBLIC_` 변수에는 비밀 키를 넣지 마세요.
