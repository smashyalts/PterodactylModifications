#!/bin/bash
echo I am not liable for any damage caused by this script, backups of files directly modified by this script will be automatically made, named FileBackup.tsx and DashboardBackup.tsx
echo Type 1 for Server sort, 2 for Pagination, 3 for both
read -p 'Option: ' number

sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_16.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list

sudo apt update
sudo apt install -y nodejs
npm i -g yarn # Install Yarn

cd /var/www/pterodactyl
yarn # Installs panel build dependencies
if number = 1 
then   
 yarn add react-beautiful-dnd
 cp /var/www/pterodactyl/resources/scripts/components/dashboard/DashboardContainer.tsx DashboardBackup.tsx
 curl https://www.dropbox.com/scl/fi/5mdgeh0e596i6h76d6apy/DashboardContainer.tsx?rlkey=hwexoub3l63isxag31g577q71&dl=1 -o /var/www/pterodactyl/resources/scripts/components/dashboard/DashboardContainer.tsx
fi
elif number = 2 
then
 cp /var/www/pterodactyl/resources/scripts/components/server/files/FileManagerContainer.tsx
 curl https://www.dropbox.com/scl/fi/1x6ma2ww4x24v0w9equ2n/FileManagerContainer.tsx?rlkey=bvk8gj7qxqietg54gggot71dc&dl=0 -o /var/www/pterodactyl/resources/scripts/components/server/files/FileManagerContainer.tsx
 fi
elif number = 3
then 
 cp /var/www/pterodactyl/resources/scripts/components/server/files/FileManagerContainer.tsx
 cp /var/www/pterodactyl/resources/scripts/components/dashboard/DashboardContainer.tsx DashboardBackup.tsx
 curl https://www.dropbox.com/scl/fi/5mdgeh0e596i6h76d6apy/DashboardContainer.tsx?rlkey=hwexoub3l63isxag31g577q71&dl=1 -o /var/www/pterodactyl/resources/scripts/components/dashboard/DashboardContainer.tsx
 curl https://www.dropbox.com/scl/fi/1x6ma2ww4x24v0w9equ2n/FileManagerContainer.tsx?rlkey=bvk8gj7qxqietg54gggot71dc&dl=0 -o /var/www/pterodactyl/resources/scripts/components/server/files/FileManagerContainer.tsx
 yarn add react-beautiful-dnd 
fi

yarn build:production
