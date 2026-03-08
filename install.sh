#!/bin/bash

# ===========================================
# Flashcards — Automatisk installation (Mac)
# ===========================================
# Detta script installerar allt som behövs och startar appen.
# Användaren behöver bara klistra in EN rad i Terminal.

set -e

# Färger för output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

print_step() {
  echo ""
  echo -e "${GREEN}${BOLD}[$1/6]${NC} ${BOLD}$2${NC}"
  echo ""
}

print_info() {
  echo -e "  ${YELLOW}→${NC} $1"
}

print_success() {
  echo -e "  ${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "  ${RED}✗${NC} $1"
}

echo ""
echo -e "${BOLD}╔══════════════════════════════════════╗${NC}"
echo -e "${BOLD}║     Flashcards — Installation        ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════╝${NC}"
echo ""

# -------------------------------------------
# Steg 1: Xcode Command Line Tools
# -------------------------------------------
print_step 1 "Kollar Xcode Command Line Tools..."

if xcode-select -p &>/dev/null; then
  print_success "Redan installerat."
else
  print_info "Installerar Xcode Command Line Tools..."
  print_info "En popup kan dyka upp — klicka 'Install' och vänta."

  # Trigger installation
  xcode-select --install 2>/dev/null || true

  # Wait for installation to complete
  print_info "Väntar på att installationen ska bli klar..."
  until xcode-select -p &>/dev/null; do
    sleep 5
  done
  print_success "Xcode Command Line Tools installerat."
fi

# -------------------------------------------
# Steg 2: Homebrew
# -------------------------------------------
print_step 2 "Kollar Homebrew..."

if command -v brew &>/dev/null; then
  print_success "Redan installerat."
else
  # Check if brew exists but isn't in PATH
  if [ -f /opt/homebrew/bin/brew ]; then
    print_info "Homebrew finns men saknas i PATH. Fixar..."
    eval "$(/opt/homebrew/bin/brew shellenv)"
  else
    print_info "Installerar Homebrew (du kan behöva skriva ditt Mac-lösenord)..."
    NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Add to PATH for this session and permanently
    if [ -f /opt/homebrew/bin/brew ]; then
      eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
  fi

  # Make sure brew is in PATH permanently
  SHELL_PROFILE=""
  if [ -n "$ZSH_VERSION" ] || [ "$SHELL" = "/bin/zsh" ]; then
    SHELL_PROFILE="$HOME/.zprofile"
  else
    SHELL_PROFILE="$HOME/.bash_profile"
  fi

  if ! grep -q "brew shellenv" "$SHELL_PROFILE" 2>/dev/null; then
    echo >> "$SHELL_PROFILE"
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> "$SHELL_PROFILE"
    print_info "Homebrew tillagt i $SHELL_PROFILE"
  fi

  if command -v brew &>/dev/null; then
    print_success "Homebrew installerat."
  else
    print_error "Kunde inte installera Homebrew. Starta om Terminal och kör scriptet igen."
    exit 1
  fi
fi

# -------------------------------------------
# Steg 3: Node.js
# -------------------------------------------
print_step 3 "Kollar Node.js..."

if command -v node &>/dev/null; then
  NODE_VERSION=$(node --version)
  print_success "Redan installerat ($NODE_VERSION)."
else
  print_info "Installerar Node.js..."
  brew install node
  print_success "Node.js installerat ($(node --version))."
fi

# -------------------------------------------
# Steg 4: Ladda ner appen
# -------------------------------------------
print_step 4 "Laddar ner appen..."

INSTALL_DIR="$HOME/Desktop/viggos-flashcard-app"

if [ -d "$INSTALL_DIR" ]; then
  print_info "Mappen finns redan. Uppdaterar..."
  cd "$INSTALL_DIR"
  git pull origin main 2>/dev/null || true
else
  print_info "Klonar från GitHub..."
  git clone https://github.com/viggofredriksson-lgtm/viggos-flashcard-app.git "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

print_success "Appen nedladdad till Desktop."

# -------------------------------------------
# Steg 5: Installera dependencies och databas
# -------------------------------------------
print_step 5 "Installerar dependencies..."

npm install --loglevel=error 2>&1 | tail -1
print_success "Dependencies installerade."

print_info "Sätter upp databasen..."
npx prisma generate 2>/dev/null
npx prisma migrate dev --name init 2>/dev/null || true
print_success "Databasen redo."

# -------------------------------------------
# Steg 6: Skapa startscript
# -------------------------------------------
print_step 6 "Skapar genvägar..."

# Create a simple start script on the Desktop
cat > "$HOME/Desktop/starta-flashcards.command" << 'STARTSCRIPT'
#!/bin/bash
cd ~/Desktop/viggos-flashcard-app

# Make sure brew is available
if [ -f /opt/homebrew/bin/brew ]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
fi

echo ""
echo "Startar Flashcards..."
echo "Öppna http://localhost:3000 i din webbläsare."
echo "Tryck Ctrl+C här för att stänga appen."
echo ""

# Open browser after a short delay
(sleep 3 && open http://localhost:3000) &

npm run dev
STARTSCRIPT

chmod +x "$HOME/Desktop/starta-flashcards.command"
print_success "Genväg skapad på Desktop: 'starta-flashcards'"

# -------------------------------------------
# Klart!
# -------------------------------------------
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║        Installation klar!            ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}Starta appen:${NC}"
echo -e "  Dubbelklicka på ${BOLD}'starta-flashcards'${NC} på skrivbordet."
echo ""
echo -e "  ${BOLD}Eller kör i Terminal:${NC}"
echo -e "  cd ~/Desktop/viggos-flashcard-app && npm run dev"
echo ""

# Ask if they want to start now
read -p "  Vill du starta appen nu? (j/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[JjYy]$ ]]; then
  echo ""
  print_info "Startar appen och öppnar webbläsaren..."
  (sleep 3 && open http://localhost:3000) &
  npm run dev
fi
