# Stage 1: Build React/Vite application
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./
RUN npm ci

# Default build-time environment variables for Vite
ARG VITE_SUPABASE_URL=https://kmiikybkejggpdpsnllr.supabase.co
ARG VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttaWlreWJrZWpnZ3BkcHNubGxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NTIxNTAsImV4cCI6MjA4NzAyODE1MH0.r46GdHg0A8ZpifvB9s1vr8xbhdtV4OOmzsyp9FxOspk
ARG VITE_SUPABASE_PROJECT_ID=kmiikybkejggpdpsnllr

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
