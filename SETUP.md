# Installationsguide (Mac)

En steg-för-steg-guide för att ladda ner och köra appen. Du behöver ingen tidigare erfarenhet — följ bara stegen.

---

## Steg 1 — Öppna Terminal

Tryck `Cmd + Mellanslag`, skriv `Terminal`, tryck Enter.

Alla kommandon nedan klistrar du in i Terminal och trycker Enter.

---

## Steg 2 — Installera Homebrew

Homebrew är en pakethanterare för Mac — den hjälper dig installera program via terminalen.

Klistra in detta:

```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Den kommer fråga om ditt **Mac-lösenord** (du ser inga tecken när du skriver — det är normalt). Skriv in det och tryck Enter.

Tryck Enter igen när den ber dig bekräfta installationen.

**Viktigt:** När installationen är klar, kör dessa tre rader (en åt gången eller alla på en gång):

```
echo >> ~/.zprofile
echo 'eval "$(/opt/homebrew/bin/brew shellenv zsh)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv zsh)"
```

---

## Steg 3 — Installera det som behövs

```
brew install node git gh
```

Detta installerar:
- **Node.js** — kör appen
- **Git** — hanterar koden
- **GitHub CLI** — kopplar ihop med GitHub

---

## Steg 4 — Logga in på GitHub

```
gh auth login
```

Du får några val — välj:
1. `GitHub.com`
2. `HTTPS`
3. `Yes` (authenticate with GitHub credentials)
4. `Login with a web browser`

En kod visas i terminalen. Tryck Enter, en webbsida öppnas — klistra in koden där och logga in med ditt GitHub-konto.

Om du inte har ett GitHub-konto, skapa ett gratis på https://github.com/signup först.

---

## Steg 5 — Ladda ner och starta appen

Kör dessa kommandon **en rad i taget**:

```
cd ~/Desktop
```

```
gh repo clone viggofredriksson-lgtm/viggos-flashcard-app
```

```
cd viggos-flashcard-app
```

```
npm install
```

```
npx prisma generate
```

```
npx prisma migrate dev
```

```
npm run dev
```

---

## Steg 6 — Öppna appen

Gå till din webbläsare och öppna:

```
http://localhost:3000
```

Appen körs nu! Du kan stänga den genom att gå tillbaka till Terminal och trycka `Ctrl + C`.

---

## Nästa gång du vill köra appen

Du behöver bara köra dessa två kommandon:

```
cd ~/Desktop/viggos-flashcard-app
npm run dev
```

Sen öppna `http://localhost:3000` igen.
