# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
## Backend connection

Set `VITE_API_BASE_URL` in `.env.local` to the backend origin (for example, `https://api.example.com`). API requests use that origin plus the paths in the API specification. If the backend is served from the same origin as Vite, leave the value empty.

The app requests nearby parking data with the browser's location permission. A search term uses the `name` query parameter. Parking cards, detail fields, congestion, favorites, reviews, and account data are populated from API responses; no sample parking or review records are bundled in the UI.
