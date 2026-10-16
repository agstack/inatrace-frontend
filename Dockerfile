# syntax=docker/dockerfile:1

# Builds the frontend image from source. REVISION is the version embedded in the app
# (see RELEASE.md). Runtime settings are applied when the container starts, from
# environment variables (src/assets/env.template.js), so one image serves any environment.

FROM node:14-alpine AS build
# git: one dependency (openapi-typescript-angular-generator) is installed from GitHub.
RUN apk add --no-cache git
WORKDIR /src
# Dependencies get their own layer, rebuilt only when the lock file changes, so the layer
# cache (local or CI) avoids downloading them on every build.
COPY package.json package-lock.json ./
# ngcc prepares the Angular libraries for Ivy; run once here, in parallel, it is cached
# with the dependencies instead of running package by package in every build.
RUN npm ci --no-audit --no-fund \
 && npx ngcc --properties es2015 browser module main --first-only --create-ivy-entry-points
COPY . .
ARG REVISION=dev
RUN printf "export const VERSION = '%s';\n" "$REVISION" > src/environments/version.ts \
 && npm run build:prod

# Runs as the unprivileged nginx user (uid 101), so it listens on 8080.
FROM nginxinc/nginx-unprivileged:1.30.5-alpine
COPY nginx.conf /etc/nginx/nginx.conf
# Owned by nginx so env.js can be written at start.
COPY --from=build --chown=nginx:nginx /src/dist /app
EXPOSE 8080
CMD ["/bin/sh", "-c", "envsubst < /app/assets/env.template.js > /app/assets/env.js && exec nginx -g 'daemon off;'"]
