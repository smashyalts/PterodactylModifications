#!/bin/bash

print_info() {
  echo -e "\033[1;34m[INFO]\033[0m $1"
}

print_warning() {
  echo -e "\033[1;33m[WARNING]\033[0m $1"
}

print_error() {
  echo -e "\033[1;31m[ERROR]\033[0m $1"
}

print_success() {
  echo -e "\033[1;32m[SUCCESS]\033[0m $1"
}

# Check if sudo is installed
check_sudo() {
  if ! command -v sudo > /dev/null 2>&1; then
    print_error "sudo is not installed. Please install sudo and run this script again."
    exit 1
  fi
}

# Check if user has sudo privileges
check_sudo_privileges() {
  if ! sudo -v > /dev/null 2>&1; then
    print_error "You do not have sudo privileges. Please run this script with a user that has sudo access."
    exit 1
  fi
}

# Check if Node.js is installed
check_node() {
  if command -v node > /dev/null 2>&1; then
    NODE_VERSION=$(node -v | grep -oE '[0-9]+')
    print_info "Node.js version $NODE_VERSION found."
    if [ "$NODE_VERSION" -lt 16 ]; then
      print_warning "Node.js version is lower than 16."
      read -p "Do you want to install Node.js 16? (y/n): " install_node
      if [ "$install_node" == "y" ]; then
        install_nodejs
      else
        print_error "Node.js 16 is required. Exiting."
        exit 1
      fi
    elif [ "$NODE_VERSION" -gt 16 ]; then
      print_warning "Node.js version is higher than 16."
      print_info "Running export NODE_OPTIONS=--openssl-legacy-provider."
      export NODE_OPTIONS=--openssl-legacy-provider
    fi
  else
    print_warning "Node.js not found."
    install_nodejs
  fi
}

# Install Node.js 16
install_nodejs() {
  print_info "Installing Node.js 16..."
  sudo mkdir -p /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_16.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
  sudo apt update
  sudo apt install -y nodejs
  print_success "Node.js 16 installed."
}

# Function to install yarn
install_yarn() {
  print_info "Installing Yarn..."
  npm i -g yarn
  print_success "Yarn installed."
}

# Function to backup and replace files
backup_and_replace() {
  local src=$1
  local dest=$2
  local url=$3
  local backup="${src}.backup"

  cp "$src" "$backup"
  curl -L -f "$url" > "$dest"
  print_success "Backed up $src to $backup and replaced with new content from $url."
}

# Main script logic
main() {
  print_info "I am not liable for any damage caused by this script. Backups of files directly modified by this script will be automatically made, named with a .backup suffix."
  print_info "Type 1 for Server sort, 2 for Pagination, 3 for both."

  read -p 'Option: ' number

  check_sudo
  check_sudo_privileges
  check_node
  install_yarn

  cd /var/www/pterodactyl || { print_error "Failed to change directory to /var/www/pterodactyl"; exit 1; }
  yarn

  case "$number" in
    1)
      backup_and_replace "/var/www/pterodactyl/resources/scripts/components/dashboard/DashboardContainer.tsx" \
                         "/var/www/pterodactyl/resources/scripts/components/dashboard/DashboardContainer.tsx" \
                         "https://raw.githubusercontent.com/smashyalts/PterodactylModifications/main/DashboardContainer.tsx"
      yarn add react-beautiful-dnd
      yarn add @types/react-beautiful-dnd --dev
      ;;
    2)
      backup_and_replace "/var/www/pterodactyl/resources/scripts/components/server/files/FileManagerContainer.tsx" \
                         "/var/www/pterodactyl/resources/scripts/components/server/files/FileManagerContainer.tsx" \
                         "https://raw.githubusercontent.com/smashyalts/PterodactylModifications/main/FileManagerContainer.tsx"
      ;;
    3)
      backup_and_replace "/var/www/pterodactyl/resources/scripts/components/server/files/FileManagerContainer.tsx" \
                         "/var/www/pterodactyl/resources/scripts/components/server/files/FileManagerContainer.tsx" \
                         "https://raw.githubusercontent.com/smashyalts/PterodactylModifications/main/FileManagerContainer.tsx"
      
      backup_and_replace "/var/www/pterodactyl/resources/scripts/components/dashboard/DashboardContainer.tsx" \
                         "/var/www/pterodactyl/resources/scripts/components/dashboard/DashboardContainer.tsx" \
                         "https://raw.githubusercontent.com/smashyalts/PterodactylModifications/main/DashboardContainer.tsx"
      yarn add react-beautiful-dnd
      yarn add @types/react-beautiful-dnd --dev
      ;;
    *)
      print_error "Invalid option selected."
      exit 1
      ;;
  esac

  yarn build:production
  print_success "Build completed successfully."
}

# Run main script
main
