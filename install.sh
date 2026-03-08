#!/bin/bash

# ===========================================
# Flashcards — Automatisk installation (Mac)
# ===========================================
# Kräver INTE admin-rättigheter.
# Användaren behöver bara klistra in EN rad i Terminal.

set -e

# Färger
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

TOTAL_STEPS=5

print_step() {
  echo ""
  echo -e "${GREEN}${BOLD}[$1/$TOTAL_STEPS]${NC} ${BOLD}$2${NC}"
  echo ""
}

print_info() {
  echo -e "  ${YELLOW}>${NC} $1"
}

print_success() {
  echo -e "  ${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "  ${RED}✗${NC} $1"
}

trap 'echo ""; print_error "Något gick fel. Kopiera texten ovanför och skicka till Viggo så hjälper han dig."; exit 1' ERR

echo ""
echo -e "${BOLD}╔══════════════════════════════════════╗${NC}"
echo -e "${BOLD}║     Flashcards — Installation        ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${DIM}Installationen tar ca 3-5 minuter.${NC}"
echo -e "  ${DIM}Inget lösenord behövs.${NC}"

# -------------------------------------------
# Steg 1: Xcode Command Line Tools
# -------------------------------------------
print_step 1 "Kollar utvecklarverktyg..."

if xcode-select -p &>/dev/null; then
  print_success "Redan installerat."
else
  print_info "En popup dyker upp strax — klicka 'Install' och vänta."
  print_info "Det här steget kan ta 5-10 minuter. Det är helt normalt."

  xcode-select --install 2>/dev/null || true

  print_info "Väntar på att installationen ska bli klar..."
  while ! xcode-select -p &>/dev/null; do
    sleep 5
  done
  print_success "Utvecklarverktyg installerat."
fi

# -------------------------------------------
# Steg 2: Node.js (direkt, utan Homebrew)
# -------------------------------------------
print_step 2 "Kollar Node.js..."

# Kolla alla ställen Node kan finnas
NODE_CMD=""
if command -v node &>/dev/null; then
  NODE_CMD="node"
elif [ -f "$HOME/.local/node/bin/node" ]; then
  export PATH="$HOME/.local/node/bin:$PATH"
  NODE_CMD="node"
elif [ -f /opt/homebrew/bin/node ]; then
  export PATH="/opt/homebrew/bin:$PATH"
  NODE_CMD="node"
elif [ -f /usr/local/bin/node ]; then
  NODE_CMD="/usr/local/bin/node"
fi

if [ -n "$NODE_CMD" ] && command -v node &>/dev/null; then
  print_success "Redan installerat ($(node --version))."
else
  print_info "Installerar Node.js..."

  # Bestäm arkitektur (Apple Silicon vs Intel)
  ARCH=$(uname -m)
  if [ "$ARCH" = "arm64" ]; then
    NODE_ARCH="arm64"
  else
    NODE_ARCH="x64"
  fi

  NODE_VERSION="v22.14.0"
  NODE_URL="https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-darwin-${NODE_ARCH}.tar.gz"
  NODE_DIR="$HOME/.local/node"

  # Ladda ner och packa upp till ~/.local/node
  mkdir -p "$HOME/.local"
  print_info "Laddar ner Node.js ${NODE_VERSION}..."
  curl -sL "$NODE_URL" | tar -xz -C "$HOME/.local"
  rm -rf "$NODE_DIR"
  mv "$HOME/.local/node-${NODE_VERSION}-darwin-${NODE_ARCH}" "$NODE_DIR"

  export PATH="$HOME/.local/node/bin:$PATH"

  # Lägg till i PATH permanent
  SHELL_PROFILE="$HOME/.zprofile"
  if [ "$SHELL" != "/bin/zsh" ] && [ -z "$ZSH_VERSION" ]; then
    SHELL_PROFILE="$HOME/.bash_profile"
  fi

  if ! grep -q '.local/node/bin' "$SHELL_PROFILE" 2>/dev/null; then
    echo >> "$SHELL_PROFILE"
    echo 'export PATH="$HOME/.local/node/bin:$PATH"' >> "$SHELL_PROFILE"
  fi

  print_success "Node.js installerat ($(node --version))."
fi

# -------------------------------------------
# Steg 3: Ladda ner appen
# -------------------------------------------
print_step 3 "Laddar ner appen..."

INSTALL_DIR="$HOME/Desktop/viggos-flashcard-app"

if [ -d "$INSTALL_DIR" ]; then
  print_info "Mappen finns redan. Uppdaterar..."
  cd "$INSTALL_DIR"
  git pull origin main 2>/dev/null || true
else
  print_info "Laddar ner från internet..."
  git clone --quiet --depth 1 https://github.com/viggofredriksson-lgtm/viggos-flashcard-app.git "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

print_success "Appen nedladdad till skrivbordet."

# -------------------------------------------
# Steg 4: Installera paket och databas
# -------------------------------------------
print_step 4 "Installerar allt appen behöver..."

print_info "Installerar paket..."
npm ci --loglevel=error 2>&1 | tail -1
print_success "Paket installerade."

print_info "Sätter upp databasen..."
npx prisma generate 2>/dev/null
npx prisma migrate dev --name init 2>/dev/null || true
print_success "Databasen redo."

# -------------------------------------------
# Steg 5: Skapa genväg på skrivbordet
# -------------------------------------------
print_step 5 "Skapar genväg på skrivbordet..."

cat > "$HOME/Desktop/starta-flashcards.command" << 'STARTSCRIPT'
#!/bin/bash
clear

APP_DIR="$HOME/Desktop/viggos-flashcard-app"

if [ ! -d "$APP_DIR" ]; then
  echo ""
  echo "Appen hittades inte!"
  echo "Kör installationen igen genom att klistra in detta i Terminal:"
  echo ""
  echo '  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/viggofredriksson-lgtm/viggos-flashcard-app/main/install.sh)"'
  echo ""
  read -p "Tryck Enter för att stänga..." -r
  exit 1
fi

cd "$APP_DIR"

# Se till att node/npm finns i PATH
if [ -d "$HOME/.local/node/bin" ]; then
  export PATH="$HOME/.local/node/bin:$PATH"
fi
if [ -f /opt/homebrew/bin/brew ]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
fi

if ! command -v npm &>/dev/null; then
  echo ""
  echo "Node.js hittades inte. Kör installationen igen."
  echo ""
  read -p "Tryck Enter för att stänga..." -r
  exit 1
fi

# Kolla om appen redan är igång
if lsof -i :3000 &>/dev/null; then
  echo ""
  echo "Appen verkar redan vara igång!"
  echo "Öppnar webbläsaren..."
  open http://localhost:3000
  echo ""
  read -p "Tryck Enter för att stänga detta fönster..." -r
  exit 0
fi

echo ""
echo "══════════════════════════════════════"
echo "  Flashcards startar...              "
echo "══════════════════════════════════════"
echo ""
echo "  Webbläsaren öppnas automatiskt."
echo ""
echo "  FÖR ATT STÄNGA APPEN:"
echo "  Stäng bara det här fönstret."
echo ""
echo "══════════════════════════════════════"
echo ""

# Öppna webbläsaren när servern är redo
(
  while ! curl -s http://localhost:3000 >/dev/null 2>&1; do
    sleep 1
  done
  open http://localhost:3000
) &

npm run dev 2>&1
STARTSCRIPT

chmod +x "$HOME/Desktop/starta-flashcards.command"
xattr -d com.apple.quarantine "$HOME/Desktop/starta-flashcards.command" 2>/dev/null || true

print_success "Genväg skapad: 'starta-flashcards' på skrivbordet."

# -------------------------------------------
# Klart!
# -------------------------------------------
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║        Installation klar!            ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}Nästa gång du vill plugga:${NC}"
echo -e "  Dubbelklicka ${BOLD}'starta-flashcards'${NC} på skrivbordet."
echo -e "  Webbläsaren öppnas automatiskt."
echo ""

read -p "  Vill du starta appen nu? (j/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[JjYy]$ ]]; then
  echo ""
  print_info "Startar appen..."
  (
    while ! curl -s http://localhost:3000 >/dev/null 2>&1; do
      sleep 1
    done
    open http://localhost:3000
  ) &
  npm run dev
fi
