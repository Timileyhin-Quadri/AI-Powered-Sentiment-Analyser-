# Stage 1: Build React/Vite application
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./
RUN npm ci

# Default build-time environment variables for Vite
ARG VITE_SUPABASE_URL=https://keaqonqlvicdwlsdnqpe.supabase.co
ARG VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_59LYLM6sCtxQXJsxHi6M7Q_aNWxOu-4
ARG VITE_SUPABASE_PROJECT_ID=keaqonqlvicdwlsdnqpe

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Serve static files with Nginx
FROM nginx:alpine

# Remove default nginx html
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx reverse proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
