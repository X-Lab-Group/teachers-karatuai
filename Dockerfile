FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Build-time env vars consumed by Vite. Empty defaults are intentional so a
# fresh clone (no .env, no build-arg) still produces a working bundle —
# features that depend on these gracefully degrade when the value is empty.
ARG VITE_CLASSROOM_FORM_ENDPOINT=""
ENV VITE_CLASSROOM_FORM_ENDPOINT=${VITE_CLASSROOM_FORM_ENDPOINT}
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
