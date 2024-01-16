#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: $0 <limit>"
  exit 1
fi

LIMIT=$1

sed -i "s/slice(0, [0-9]\+)/slice(0, $LIMIT)/" /var/www/pterodactyl/resources/scripts/components/server/files/FileManagerContainer.tsx

sed -i "s/files.length > [0-9]\+/files.length > $LIMIT/" /var/www/pterodactyl/resources/scripts/components/server/files/FileManagerContainer.tsx

sed -i "s/to the first [0-9]\+ files\./to the first $LIMIT files./" /var/www/pterodactyl/resources/scripts/components/server/files/FileManagerContainer.tsx
echo "Updated the limit in the React component to $LIMIT"

yarn build:production

echo "Production build completed"