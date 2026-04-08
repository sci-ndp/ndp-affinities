#!/bin/sh

ROOT_PATH="${ROOT_PATH:-/}"
VITE_API_URL="${VITE_API_URL:-http://localhost:8000}"

# Ensure ROOT_PATH ends with /
case "$ROOT_PATH" in
  */) ;;
  *)  ROOT_PATH="${ROOT_PATH}/" ;;
esac

# Generate runtime config for the React app
cat > /usr/share/nginx/html/config.js <<EOF
window.__AFFINITIES_CONFIG__ = {
  rootPath: "${ROOT_PATH}",
  apiUrl: "${VITE_API_URL}"
};
EOF

# Rewrite asset paths in index.html to include ROOT_PATH prefix (only if not /)
if [ "$ROOT_PATH" != "/" ]; then
  sed -i "s|=\"/assets/|=\"${ROOT_PATH}assets/|g" /usr/share/nginx/html/index.html
  sed -i "s|=\"/config.js\"|=\"${ROOT_PATH}config.js\"|g" /usr/share/nginx/html/index.html
fi

# Generate nginx config dynamically
if [ "$ROOT_PATH" = "/" ]; then
  cat > /etc/nginx/conf.d/default.conf <<NGINX
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX
else
  # Strip trailing slash for location block
  LOCATION_PATH=$(echo "$ROOT_PATH" | sed 's|/$||')

  cat > /etc/nginx/conf.d/default.conf <<NGINX
server {
    listen 80;
    server_name localhost;

    location ${LOCATION_PATH}/ {
        alias /usr/share/nginx/html/;
        try_files \$uri \$uri/ ${LOCATION_PATH}/index.html;

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    location = ${LOCATION_PATH} {
        return 301 \$scheme://\$host${LOCATION_PATH}/;
    }
}
NGINX
fi

# Start nginx
exec nginx -g 'daemon off;'
