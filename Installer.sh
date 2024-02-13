#!/bin/bash
echo "I am not liable for any damage caused by this script, backups of files directly modified by this script will be automatically made, named FileBackup.tsx and DashboardBackup.tsx"
echo "This script only works on NodeJS 16 (lower possibly works but hasn't been tested), NodeJS 17+ isnt supported OOB unless you have ran export NODE_OPTIONS=--openssl-legacy-provider at least once"
echo "Type 1 for Server sort, 2 for Pagination, 3 for both"
read -p 'Option: ' number

sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_16.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list

sudo apt update
sudo apt install -y nodejs
npm i -g yarn # Install Yarn

cd /var/www/pterodactyl
yarn # Installs panel build dependencies

if [ "$number" -eq "1" ]; then
  cp /var/www/pterodactyl/resources/scripts/components/dashboard/DashboardContainer.tsx DashboardBackup.tsx
  cd /var/www/pterodactyl
  yarn add react-beautiful-dnd
  yarn add @types/react-beautiful-dnd --dev
  curl -L -f https://www.dropbox.com/scl/fi/g0d08ccjxoabyrnk22ocr/DashboardContainer.tsx?rlkey=vxl4pyhoggtrtv56e7y4lq42n > /var/www/pterodactyl/resources/scripts/components/dashboard/DashboardContainer.tsx
elif [ "$number" -eq "2" ]; then
  cp /var/www/pterodactyl/resources/scripts/components/server/files/FileManagerContainer.tsx FileBackup.tsx
  curl -L -f https://www.dropbox.com/scl/fi/1x6ma2ww4x24v0w9equ2n/FileManagerContainer.tsx?rlkey=bvk8gj7qxqietg54gggot71dc > /var/www/pterodactyl/resources/scripts/components/server/files/FileManagerContainer.tsx
elif [ "$number" -eq "3" ]; then
  cp /var/www/pterodactyl/resources/scripts/components/server/files/FileManagerContainer.tsx FileBackup.tsx
  cp /var/www/pterodactyl/resources/scripts/components/dashboard/DashboardContainer.tsx DashboardBackup.tsx
  cd /var/www/pterodactyl
  yarn add react-beautiful-dnd
  yarn add @types/react-beautiful-dnd --dev
  curl -L -f https://www.dropbox.com/scl/fi/g0d08ccjxoabyrnk22ocr/DashboardContainer.tsx?rlkey=vxl4pyhoggtrtv56e7y4lq42n > /var/www/pterodactyl/resources/scripts/components/dashboard/DashboardContainer.tsx
  curl -L -f https://www.dropbox.com/scl/fi/1x6ma2ww4x24v0w9equ2n/FileManagerContainer.tsx?rlkey=bvk8gj7qxqietg54gggot71dc > /var/www/pterodactyl/resources/scripts/components/server/files/FileManagerContainer.tsx
fi

yarn build:production
