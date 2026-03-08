import { NextRequest, NextResponse } from "next/server";
import { importCards } from "@/lib/csv-import";

// POST /api/import
// Accepts a CSV file upload and imports the flashcards into the database.
//
// Why a POST route instead of doing it client-side?
// The database (Prisma) can only be accessed on the server.
// So the browser sends the file here, we parse and import it,
// then send back the results.

export async function POST(request: NextRequest) {
  try {
    // Get the uploaded file from the form data
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No CSV file provided. Upload a file with the field name 'file'." },
        { status: 400 }
      );
    }

    // Validate it's a CSV
    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "File must be a .csv file." },
        { status: 400 }
      );
    }

    // Read the file contents as text
    const csvText = await file.text();

    if (!csvText.trim()) {
      return NextResponse.json(
        { error: "The CSV file is empty." },
        { status: 400 }
      );
    }

    // Import the cards
    const results = await importCards(csvText);

    // Summary for the response
    const totalImported = results.reduce((sum, r) => sum + r.imported, 0);
    const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);

    return NextResponse.json({
      success: true,
      summary: {
        totalImported,
        totalSkipped,
        decks: results.map((r) => ({
          name: r.deckName,
          imported: r.imported,
          skipped: r.skipped,
          errors: r.errors,
        })),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
