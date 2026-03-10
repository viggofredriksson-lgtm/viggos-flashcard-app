# Flashcards

AI-drivna flashcards med spaced repetition. Skapa flashcards genom att klistra in ditt studiematerial i valfri LLM (Claude, ChatGPT, etc.), importera CSV-filen, och börja plugga.

## Installation

### Mac

Öppna Terminal (`Cmd + Mellanslag`, skriv `Terminal`, tryck Enter) och klistra in detta:

```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/viggofredriksson-lgtm/viggos-flashcard-app/main/install.sh)"
```

### Windows

Öppna PowerShell (`Win + X`, välj "PowerShell") och klistra in detta:

```
irm https://raw.githubusercontent.com/viggofredriksson-lgtm/viggos-flashcard-app/main/install.ps1 | iex
```

> **OBS:** Om du får ett felmeddelande om execution policy, kör detta först:
> `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`

### Starta appen efteråt

Dubbelklicka på **starta-flashcards** på skrivbordet.
