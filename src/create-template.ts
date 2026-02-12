import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import * as fs from "fs";
import * as path from "path";

/**
 * Creates a sample renewal document template.
 * Run with: npx ts-node src/create-template.ts
 */

const TEMPLATE_CONTENT = `
HOME CONCIERGE SERVICE
RENEWAL AGREEMENT

Date: {date}

Client: {client_name}
Email: {email}
Phone: {phone}
Property Address: {address}

Dear {client_name},

Thank you for being a valued Home Concierge client. We are pleased to offer you a renewal of your home concierge service agreement.

RENEWAL DETAILS
- Current Agreement Year: {year}
- Renewal Period: {year} - {next_year}
- Renewal Date: {renewal_date}

SERVICES INCLUDED
Your renewed Home Concierge membership includes:
- Regular home maintenance inspections
- Priority scheduling for all home services
- 24/7 emergency support line
- Seasonal maintenance reminders and coordination
- Vendor management and quality assurance

Please review this renewal agreement and confirm your continued membership by contacting us at your earliest convenience.

We look forward to continuing to serve you and maintaining the comfort and value of your home.

Sincerely,
Home Concierge Team
`;

function createTemplate(outputPath: string): void {
  // Create a minimal .docx using PizZip + docxtemplater
  // Start from a bare-bones .docx structure
  const zip = new PizZip();

  // Content Types
  zip.file(
    "[Content_Types].xml",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      "</Types>"
  );

  // Relationships
  zip.file(
    "_rels/.rels",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      "</Relationships>"
  );

  // Word relationships
  zip.file(
    "word/_rels/document.xml.rels",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      "</Relationships>"
  );

  // Build paragraphs from template content
  const lines = TEMPLATE_CONTENT.trim().split("\n");
  const paragraphs = lines
    .map((line) => {
      const escaped = line
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      // Keep {placeholders} as-is for docxtemplater
      return (
        "<w:p><w:r><w:t xml:space=\"preserve\">" +
        escaped +
        "</w:t></w:r></w:p>"
      );
    })
    .join("");

  // Document XML
  zip.file(
    "word/document.xml",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" ' +
      'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" ' +
      'xmlns:o="urn:schemas-microsoft-com:office:office" ' +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
      'xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" ' +
      'xmlns:v="urn:schemas-microsoft-com:vml" ' +
      'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ' +
      'xmlns:w10="urn:schemas-microsoft-com:office:word" ' +
      'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
      'xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml">' +
      "<w:body>" +
      paragraphs +
      "</w:body></w:document>"
  );

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const buffer = zip.generate({ type: "nodebuffer" });
  fs.writeFileSync(outputPath, buffer);
  console.log(`Template created: ${outputPath}`);
}

const outputPath =
  process.argv[2] || path.join(__dirname, "../templates/renewal-template.docx");
createTemplate(outputPath);
