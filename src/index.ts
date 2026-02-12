import * as dotenv from "dotenv";
import { Command } from "commander";
import { fetchClientData, ClientRow } from "./sheets";
import { generateRenewalDoc } from "./docgen";

dotenv.config();

const program = new Command();

program
  .name("concierge-renewal")
  .description(
    "Generate Home Concierge renewal documents from Google Sheets data"
  )
  .option(
    "--spreadsheet-id <id>",
    "Google Spreadsheet ID",
    process.env.GOOGLE_SPREADSHEET_ID
  )
  .option(
    "--sheet-name <name>",
    "Sheet/tab name",
    process.env.GOOGLE_SHEET_NAME || "Sheet1"
  )
  .option(
    "--key-file <path>",
    "Path to Google service account key file",
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE ||
      "./credentials/service-account.json"
  )
  .option(
    "--template <path>",
    "Path to .docx template",
    process.env.TEMPLATE_PATH || "./templates/renewal-template.docx"
  )
  .option(
    "--output <dir>",
    "Output directory",
    process.env.OUTPUT_DIR || "./output"
  )
  .option("--client <name>", "Generate for a specific client only")
  .action(async (opts) => {
    if (!opts.spreadsheetId) {
      console.error(
        "Error: --spreadsheet-id is required (or set GOOGLE_SPREADSHEET_ID in .env)"
      );
      process.exit(1);
    }

    console.log("Fetching client data from Google Sheets...");

    let clients: ClientRow[];
    try {
      clients = await fetchClientData({
        spreadsheetId: opts.spreadsheetId,
        sheetName: opts.sheetName,
        keyFilePath: opts.keyFile,
      });
    } catch (err) {
      console.error("Failed to fetch data from Google Sheets:", err);
      process.exit(1);
    }

    console.log(`Found ${clients.length} client(s) in the sheet.`);

    if (opts.client) {
      const needle = opts.client.toLowerCase();
      clients = clients.filter((c) =>
        c.clientName.toLowerCase().includes(needle)
      );
      if (clients.length === 0) {
        console.error(`No client found matching "${opts.client}".`);
        process.exit(1);
      }
      console.log(
        `Filtered to ${clients.length} client(s) matching "${opts.client}".`
      );
    }

    let generated = 0;
    for (const client of clients) {
      if (!client.clientName) {
        console.warn("Skipping row with no client name.");
        continue;
      }
      try {
        const outputPath = generateRenewalDoc(
          opts.template,
          client,
          opts.output
        );
        console.log(`  Generated: ${outputPath}`);
        generated++;
      } catch (err) {
        console.error(
          `  Failed to generate doc for ${client.clientName}:`,
          err
        );
      }
    }

    console.log(
      `\nDone. Generated ${generated} renewal document(s) in ${opts.output}/`
    );
  });

program.parse();
