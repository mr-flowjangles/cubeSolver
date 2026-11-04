# Cube Solver — local test image.
# Builds the PWA and serves it with nginx, the same static files GitHub Pages serves.

FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json index.html ./
COPY src/ ./src/
RUN npm run build

FROM nginx:1.27-alpine
LABEL org.opencontainers.image.title="Cube Solver"
LABEL org.opencontainers.image.description="Game-style Rubik's cube tutorial PWA — beginner to CFOP, with camera scan to solve your own cube."
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
