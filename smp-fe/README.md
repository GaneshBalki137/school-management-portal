# School Portal: web app

Angular 21 app (standalone components, signals, zoneless). Setup and the full feature list are in the [main README](../README.md).

```sh
npm install
npm start        # http://localhost:4200, /api proxied to 127.0.0.1:3000 (proxy.conf.json)
npm test         # unit tests (node --test)
npm run build    # production build in dist/smp-fe/browser
```

- `src/app/core`: API client, session and route guards, shared widgets, formatting helpers.
- `src/app/pages`: one file per page, grouped by role (`admin`, `teacher`, `student`).
- `src/styles.css`: the whole design system; light and dark themes are colour tokens.
