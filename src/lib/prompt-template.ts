// Prompten som användare kopierar och klistrar in i sin LLM.
// Sparas här så det är enkelt att uppdatera och alltid matchar CSV-formatet
// som vår importerare förväntar sig.

export const FLASHCARD_PROMPT = `Du är en expert på inlärning och flashcard-skapande. Din uppgift är att ta studiematerialet jag ger dig och göra om det till så effektiva flashcards som möjligt för spaced repetition-inlärning.

## Instruktioner

1. Läs igenom allt material jag ger dig noggrant.
2. Skapa flashcards baserat på dessa bevisbaserade principer:
   - **Ett koncept per kort**: Blanda aldrig ihop flera fakta på samma kort.
   - **Aktiv recall**: Frågorna ska kräva att man producerar svaret från minnet, inte bara känner igen det.
   - **Cloze-stil när det passar**: "Mitokondrien är cellens _____" funkar bra för definitioner.
   - **Varför/Hur-frågor**: Testa inte bara fakta — testa förståelse. "Varför händer X?" är bättre än "Vad är X?"
   - **Konkreta exempel**: När ett koncept är abstrakt, inkludera ett konkret exempel i svaret.
   - **Kopplingar**: Skapa kort som kopplar ihop koncept med varandra ("Hur hänger X ihop med Y?").
   - **Vanliga misstag**: Lägg till kort som tar upp typiska missuppfattningar ("Vad är skillnaden mellan X och Y?").
   - **Omvända kort när det behövs**: Om det är viktigt att kunna båda riktningarna (t.ex. glosor), skapa kort åt båda håll.

3. Outputta flashcards som en CSV-fil med exakt dessa kolumner:
   - \`question\` — framsidan av kortet
   - \`answer\` — baksidan av kortet
   - \`tags\` — kommaseparerade taggar för kategorisering (t.ex. "biologi,kapitel3,proteiner")
   - \`deck\` — decknamnet som kortet tillhör

## CSV-formatregler
- Använd dubbla citattecken runt alla fältvärden
- Separera taggar med komman inuti citattecknen (t.ex. "biologi,proteiner")
- Första raden måste vara headern: question,answer,tags,deck
- Använd UTF-8-kodning

## Exempeloutput

\`\`\`csv
question,answer,tags,deck
"Vad är cellens kraftverk?","Mitokondrien — den producerar ATP genom cellulär respiration, och omvandlar glukos och syre till användbar energi.","biologi,celler,organeller","Biologi 101"
"Varför har mitokondrier eget DNA?","Mitokondrier var troligtvis en gång frilevande bakterier som ingick ett symbiotiskt förhållande med tidiga celler (endosymbiontteorin). De behöll sitt eget DNA från det ursprunget.","biologi,celler,evolution","Biologi 101"
\`\`\`

## Studiematerial

[KLISTRA IN DITT STUDIEMATERIAL HÄR]`;

// Steg-för-steg-guide som förklarar flödet
export const USAGE_GUIDE = {
  title: "Så skapar du flashcards",
  steps: [
    {
      title: "Kopiera prompten",
      description:
        "Klicka på kopiera-knappen för att ta prompten.",
    },
    {
      title: "Öppna din LLM",
      description:
        "Gå till Claude (claude.ai), ChatGPT, eller vilken LLM du har tillgång till.",
    },
    {
      title: "Klistra in och lägg till ditt material",
      description:
        'Klistra in prompten, byt sen ut "[KLISTRA IN DITT STUDIEMATERIAL HÄR]" mot dina anteckningar, bokutdrag, föreläsningsslides, eller vad du nu vill lära dig.',
    },
    {
      title: "Ladda ner CSV-filen",
      description:
        "LLM:en genererar en CSV-fil. Ladda ner den eller kopiera CSV-texten och spara som en .csv-fil.",
    },
    {
      title: "Importera i appen",
      description:
        "Ladda upp CSV-filen här så är dina flashcards redo att plugga!",
    },
  ],
};
