# Building

Producing a production build and a Docker image.

The production build is `npm run build:prod`, with Node 14. It writes the static site to
`dist/`. The version shown in the app comes from `src/environments/version.ts`, `dev` by
default; CI sets it from the release tag.

## Docker image

Official images are published to `ghcr.io/agstack/inatrace-frontend` by CI. See
[RELEASE.md](../RELEASE.md) for the tags and the release process.

### Building

```
docker build --build-arg REVISION=<version> -t inatrace-frontend .
```

The build runs `npm ci` and the production build in a Node container, so it needs
neither Node nor npm on the host. The result is served by nginx, running as a non-root
user on port **8080**.

### Running

The image is configured at start, from environment variables, so the same image serves
any environment:

```
docker run -p 8080:8080 \
  -e ENVIRONMENT_NAME=PROD \
  -e APP_BASE_URL=https://inatrace.example.org \
  -e QR_CODE_BASE_PATH=q-cd \
  -e RELATIVE_FILE_UPLOAD_URL=/api/common/document \
  -e RELATIVE_FILE_UPLOAD_URL_MANUAL_TYPE=/api/common/document \
  -e RELATIVE_IMAGE_UPLOAD_URL=/api/common/image \
  -e RELATIVE_IMAGE_UPLOAD_URL_ALL_SIZES=/api/common/image \
  inatrace-frontend
```

| Variable | Meaning |
|---|---|
| `ENVIRONMENT_NAME` | Name of the environment, such as `PROD` or `TEST` |
| `APP_BASE_URL` | Public URL of the application |
| `QR_CODE_BASE_PATH` | Path of QR code links, usually `q-cd` |
| `RELATIVE_FILE_UPLOAD_URL`, `RELATIVE_FILE_UPLOAD_URL_MANUAL_TYPE` | Backend document upload path, usually `/api/common/document` |
| `RELATIVE_IMAGE_UPLOAD_URL`, `RELATIVE_IMAGE_UPLOAD_URL_ALL_SIZES` | Backend image upload path, usually `/api/common/image` |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key |
| `MAPBOX_ACCESS_TOKEN` | Mapbox token; the plot map does not draw without it |
| `TOKEN_FOR_PUBLIC_LOG_ROUTE` | Token for the public request log route, matching the backend's `INATrace.requestLog.token` |
| `BEYCO_AUTH_URL`, `BEYCO_CLIENT_ID` | Beyco integration, optional |

Unset variables become empty strings. The application calls the backend at `/api` on
the same host, so a reverse proxy in front of both must route `/api` to the backend.
