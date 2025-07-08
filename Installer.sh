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

check_sudo() {
  if ! command -v sudo > /dev/null 2>&1; then
    print_error "sudo is not installed. Please install sudo and run this script again."
    exit 1
  fi
}

check_sudo_privileges() {
  if ! sudo -v > /dev/null 2>&1; then
    print_error "You do not have sudo privileges. Please run this script with a user that has sudo access."
    exit 1
  fi
}

check_pterodactyl_directory() {
  if [ ! -d "/var/www/pterodactyl" ]; then
    print_error "Pterodactyl directory not found at /var/www/pterodactyl"
    exit 1
  fi
}

check_node() {
  if command -v node > /dev/null 2>&1; then
    NODE_VERSION=$(node -v | grep -oE '[0-9]+' | head -1)
    print_info "Node.js version $NODE_VERSION found."
    if [ "$NODE_VERSION" -lt 16 ]; then
      print_warning "Node.js version is lower than 16."
      if [ -t 0 ]; then
        read -p "Do you want to install Node.js 16? (y/n): " install_node
      else
        print_info "Non-interactive mode: automatically installing Node.js 16."
        install_node="y"
      fi
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
    else
      print_success "Node.js 16 is already installed."
    fi
  else
    print_warning "Node.js not found."
    if [ -t 0 ]; then
      read -p "Do you want to install Node.js 16? (y/n): " install_node
    else
      print_info "Non-interactive mode: automatically installing Node.js 16."
      install_node="y"
    fi
    if [ "$install_node" == "y" ]; then
      install_nodejs
    else
      print_error "Node.js 16 is required. Exiting."
      exit 1
    fi
  fi
}

install_nodejs() {
  print_info "Installing Node.js 16..."
  sudo mkdir -p /etc/apt/keyrings
  if ! curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg; then
    print_error "Failed to download Node.js GPG key."
    exit 1
  fi
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_16.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
  if ! sudo apt update; then
    print_error "Failed to update apt repositories."
    exit 1
  fi
  if ! sudo apt install -y nodejs; then
    print_error "Failed to install Node.js."
    exit 1
  fi
  print_success "Node.js 16 installed."
}

install_yarn() {
  if command -v yarn > /dev/null 2>&1; then
    print_info "Yarn is already installed."
  else
    print_info "Installing Yarn..."
    if ! npm i -g yarn; then
      print_error "Failed to install Yarn."
      exit 1
    fi
    print_success "Yarn installed."
  fi
}

backup_and_replace() {
  local src=$1
  local dest=$2
  local url=$3
  local timestamp=$(date +"%Y%m%d%H%M%S")
  local backup="${src}.backup.${timestamp}"

  if [ ! -f "$src" ]; then
    print_error "Source file $src does not exist."
    return 1
  fi

  if ! cp "$src" "$backup"; then
    print_error "Failed to create backup of $src"
    return 1
  fi
  
  if ! curl -L -f "$url" -o "$dest"; then
    print_error "Failed to download from $url"
    print_info "Restoring from backup..."
    cp "$backup" "$src"
    return 1
  fi
  
  print_success "Backed up $src to $backup and replaced with new content from $url."
  return 0
}

install_npm_package() {
  local package=$1
  local dev=$2

  print_info "Checking for $package..."
  
  if grep -q "\"$package\":" package.json; then
    print_info "$package is already installed."
  else
    print_info "Installing $package..."
    if [ "$dev" == "true" ]; then
      if ! yarn add "$package" --dev; then
        print_error "Failed to install $package as dev dependency."
        return 1
      fi
    else
      if ! yarn add "$package"; then
        print_error "Failed to install $package."
        return 1
      fi
    fi
    print_success "$package installed."
  fi
  return 0
}

show_usage() {
  echo "Usage: $0 [OPTION]"
  echo "Options:"
  echo "  1    Apply Server sort modification"
  echo "  2    Apply Pagination modification"
  echo "  3    Apply both modifications"
  echo "  -h   Show this help message"
  echo ""
  echo "If no option is provided, the script will prompt for input (interactive mode only)."
}

main() {
  print_info "I am not liable for any damage caused by this script. Backups of files directly modified by this script will be automatically made, named with a .backup.timestamp suffix."
  
  if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_usage
    exit 0
  fi

  if [ -n "$1" ]; then
    number="$1"
    print_info "Using option: $number"
  else
    if [ -t 0 ]; then
      print_info "Type 1 for Server sort, 2 for Pagination, 3 for both."
      read -p 'Option: ' number
    else
      print_error "No option provided and running in non-interactive mode."
      print_info "Please provide an option as a command line argument."
      show_usage
      exit 1
    fi
  fi

  check_sudo
  check_sudo_privileges
  check_pterodactyl_directory
  check_node
  install_yarn

  if ! cd /var/www/pterodactyl; then
    print_error "Failed to change directory to /var/www/pterodactyl"
    exit 1
  fi

  if ! yarn; then
    print_error "Failed to run yarn in the Pterodactyl directory."
    exit 1
  fi

  case "$number" in
    1)
      print_info "Applying Server sort modification..."
      if backup_and_replace "/var/www/pterodactyl/resources/scripts/components/dashboard/DashboardContainer.tsx" \
                           "/var/www/pterodactyl/resources/scripts/components/dashboard/DashboardContainer.tsx" \
                           "https://raw.githubusercontent.com/smashyalts/PterodactylModifications/main/DashboardContainer.tsx"; then
        install_npm_package "react-beautiful-dnd" "false"
        install_npm_package "@types/react-beautiful-dnd" "true"
      else
        print_error "Failed to apply Server sort modification."
        exit 1
      fi
      ;;
    2)
      print_info "Applying Pagination modification..."
      if ! backup_and_replace "/var/www/pterodactyl/resources/scripts/components/server/files/FileManagerContainer.tsx" \
                           "/var/www/pterodactyl/resources/scripts/components/server/files/FileManagerContainer.tsx" \
                           "https://raw.githubusercontent.com/smashyalts/PterodactylModifications/main/FileManagerContainer.tsx"; then
        print_error "Failed to apply Pagination modification."
        exit 1
      fi
      ;;
    3)
      print_info "Applying both Server sort and Pagination modifications..."
      if backup_and_replace "/var/www/pterodactyl/resources/scripts/components/server/files/FileManagerContainer.tsx" \
                           "/var/www/pterodactyl/resources/scripts/components/server/files/FileManagerContainer.tsx" \
                           "https://raw.githubusercontent.com/smashyalts/PterodactylModifications/main/FileManagerContainer.tsx" &&
         backup_and_replace "/var/www/pterodactyl/resources/scripts/components/dashboard/DashboardContainer.tsx" \
                           "/var/www/pterodactyl/resources/scripts/components/dashboard/DashboardContainer.tsx" \
                           "https://raw.githubusercontent.com/smashyalts/PterodactylModifications/main/DashboardContainer.tsx"; then
        install_npm_package "react-beautiful-dnd" "false"
        install_npm_package "@types/react-beautiful-dnd" "true"
      else
        print_error "Failed to apply both modifications."
        exit 1
      fi
      ;;
    *)
      print_error "Invalid option selected: '$number'"
      print_info "Valid options are 1, 2, or 3."
      show_usage
      exit 1
      ;;
  esac

  print_info "Building production assets. This may take a while..."
  if ! yarn build:production; then
    print_error "Failed to build production assets."
    exit 1
  fi
  
  print_success "All modifications applied and built successfully!"
  print_info "If you encounter any issues, you can restore the original files from the backups."
}

main "$@"
