# Concierge Renewal Document Generator

Automatically generates Home Concierge renewal documents (Word .docx) from client data stored in a Google Sheet.

## How It Works

1. Reads client rows from a Google Sheet (name, email, phone, address, plus any custom columns)
2. Fills a `.docx` template with each client's data
3. Outputs one renewal document per client into the `output/` directory

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Google Sheets API access

You need a Google Cloud service account with Sheets API access:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or select an existing one)
3. Enable the **Google Sheets API**
4. Create a **Service Account** under IAM & Admin > Service Accounts
5. Generate a JSON key and save it as `credentials/service-account.json`
6. Share your Google Sheet with the service account email (the `client_email` in the JSON key)

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

- `GOOGLE_SPREADSHEET_ID` — the ID from your Google Sheet URL (`https://docs.google.com/spreadsheets/d/{THIS_PART}/edit`)
- `GOOGLE_SHEET_NAME` — the tab/sheet name (default: `Sheet1`)

### 4. Create the document template

Generate the sample template:

```bash
npx ts-node src/create-template.ts
```

This creates `templates/renewal-template.docx`. You can edit this file in Word/Google Docs — just keep the `{placeholder}` tags intact.

**Available template placeholders:**

| Placeholder | Description |
|---|---|
| `{client_name}` | Client's full name |
| `{email}` | Client's email address |
| `{phone}` | Client's phone number |
| `{address}` | Property address |
| `{date}` | Today's date |
| `{renewal_date}` | Date one year from today |
| `{year}` | Current year |
| `{next_year}` | Next year |

Any column header in your Google Sheet is also available as a placeholder (spaces become underscores, lowercased). For example, a column named "Service Plan" becomes `{service_plan}`.

### 5. Google Sheet format

Your sheet should have a header row with columns like:

| Client Name | Email | Phone | Address |
|---|---|---|---|
| Jane Doe | jane@example.com | 555-0100 | 123 Oak St |
| John Smith | john@example.com | 555-0200 | 456 Elm Ave |

Column header matching is flexible — "Client Name", "Name", or "Client" all work for the client name field.

## Usage

### Generate all renewal documents

```bash
npm run generate
```

### Generate for a specific client

```bash
npm run generate -- --client "Jane Doe"
```

### CLI options

```
--spreadsheet-id <id>   Google Spreadsheet ID (or set GOOGLE_SPREADSHEET_ID)
--sheet-name <name>     Sheet tab name (default: Sheet1)
--key-file <path>       Service account key file path
--template <path>       Path to .docx template
--output <dir>          Output directory (default: ./output)
--client <name>         Filter to a specific client name
```

## Project Structure

```
concierge-renewal/
├── src/
│   ├── index.ts            # CLI entry point
│   ├── sheets.ts           # Google Sheets data fetching
│   ├── docgen.ts           # Word document generation
│   └── create-template.ts  # Sample template creator
├── templates/              # Document templates (.docx)
├── credentials/            # Google API keys (gitignored)
├── output/                 # Generated documents (gitignored)
├── .env.example            # Environment variable template
└── package.json
```
