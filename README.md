# Shelf Insight

Shelf Insight is a browser-based collection health dashboard for library staff. It tracks monthly checkouts and collection holdings, then calculates annualized turnover and month-over-month trends for each collection.

## Run locally

The project has no third-party runtime dependencies. Start the local server with:

```bash
npm run dev
```

Open <http://localhost:4173> in a browser.

## Verify and build

```bash
npm test
npm run build
npm run preview
```

The build command creates a self-contained static site in `dist/`. Monthly records and collection changes are stored in the browser's local storage.

The dashboard JavaScript is also embedded in `index.html`, so interactive controls work when the file is deployed without a bundler or asset pipeline.
