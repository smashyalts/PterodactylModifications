<h3 align="center">Pterodactyl Modifications</h3>

<p align="center">Feel free to donate to my Paypal at: classicheroestv@gmail.com</p>

<p align="center">Quality of Life Addons for Pterodactyl</p>



<br>

> [!IMPORTANT]
> You must follow (https://pterodactyl.io/community/customization/panel.html)[Pterodactyl Panel Customization Guide] at least once.

<br><br>

### Installation
Run this command:
```
curl -s https://raw.githubusercontent.com/smashyalts/PterodactylModifications/main/Installer.sh | bash
```

### Manual Installation
<br>

> [!IMPORTANT]
> File Limit Changer & File Pagination can't be used at the same time.

<br><br>
**File Limit Changer:**
Run the commands as Root:
```
wget https://raw.githubusercontent.com/smashyalts/PterodactylModifications/main/FileLimitChanger.sh
chmod +x FileLimitChanger.sh
./FileLimitChanger.sh (New File Limit)
yarn build:production
```

**File Pagination:**
Run the commands as Root:
```
wget https://raw.githubusercontent.com/smashyalts/PterodactylModifications/main/FileManagerContainer.tsx
Replace /var/www/pterodactyl/resources/scripts/components/server/files/FileManagerContainer.tsx with the Downloaded File
Run yarn build:production
```

**Server Sorter:**
Run the commands as Root:
```
wget https://raw.githubusercontent.com/smashyalts/PterodactylModifications/main/DashboardContainer.tsx
Replace /var/www/pterodactyl/resources/scripts/components/dashboard/DashboardContainer.tsx with the Downloaded File
Run yarn add react-beautiful-dnd && yarn add @types/react-beautiful-dnd --dev && yarn build:production
```
