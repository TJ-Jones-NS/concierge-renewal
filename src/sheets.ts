import { google, sheets_v4 } from "googleapis";
import { JWT } from "googleapis-common";
import * as fs from "fs";
import * as path from "path";

export interface ClientRow {
  clientName: string;
  email: string;
  phone: string;
  address: string;
  [key: string]: string;
}

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
}

function getAuthClient(keyFilePath: string): JWT {
  const absolutePath = path.resolve(keyFilePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(
      `Service account key file not found: ${absolutePath}\n` +
        "See README.md for setup instructions."
    );
  }
  const key: ServiceAccountKey = JSON.parse(
    fs.readFileSync(absolutePath, "utf-8")
  );
  return new google.auth.JWT(
    key.client_email,
    undefined,
    key.private_key,
    ["https://www.googleapis.com/auth/spreadsheets.readonly"]
  );
}

export async function fetchClientData(config: {
  spreadsheetId: string;
  sheetName: string;
  keyFilePath: string;
}): Promise<ClientRow[]> {
  const auth = getAuthClient(config.keyFilePath);
  const sheets: sheets_v4.Sheets = google.sheets({ version: "v4", auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId,
    range: config.sheetName,
  });

  const rows = response.data.values;
  if (!rows || rows.length < 2) {
    throw new Error(
      "Sheet is empty or has no data rows (expected header row + data rows)."
    );
  }

  const headers: string[] = rows[0].map((h: string) =>
    h.trim().toLowerCase().replace(/\s+/g, "_")
  );
  const dataRows = rows.slice(1);

  return dataRows.map((row: string[]) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, i) => {
      obj[header] = row[i]?.trim() ?? "";
    });

    return {
      clientName:
        obj["client_name"] || obj["name"] || obj["client"] || "",
      email: obj["email"] || obj["email_address"] || "",
      phone: obj["phone"] || obj["phone_number"] || obj["tel"] || "",
      address:
        obj["address"] || obj["property_address"] || obj["home_address"] || "",
      ...obj,
    };
  });
}
