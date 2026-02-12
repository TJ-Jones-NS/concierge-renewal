import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import * as fs from "fs";
import * as path from "path";
import { ClientRow } from "./sheets";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function generateRenewalDoc(
  templatePath: string,
  client: ClientRow,
  outputDir: string
): string {
  const absoluteTemplatePath = path.resolve(templatePath);
  if (!fs.existsSync(absoluteTemplatePath)) {
    throw new Error(`Template file not found: ${absoluteTemplatePath}`);
  }

  const templateContent = fs.readFileSync(absoluteTemplatePath, "binary");
  const zip = new PizZip(templateContent);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  const today = new Date();
  const renewalDate = new Date(today);
  renewalDate.setFullYear(renewalDate.getFullYear() + 1);

  const templateData = {
    ...client,
    client_name: client.clientName,
    date: formatDate(today),
    renewal_date: formatDate(renewalDate),
    year: today.getFullYear().toString(),
    next_year: (today.getFullYear() + 1).toString(),
  };

  doc.render(templateData);

  const outputBuffer = doc.getZip().generate({ type: "nodebuffer" });

  const absoluteOutputDir = path.resolve(outputDir);
  if (!fs.existsSync(absoluteOutputDir)) {
    fs.mkdirSync(absoluteOutputDir, { recursive: true });
  }

  const safeName = client.clientName
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_");
  const filename = `Renewal_${safeName}_${today.toISOString().slice(0, 10)}.docx`;
  const outputPath = path.join(absoluteOutputDir, filename);

  fs.writeFileSync(outputPath, outputBuffer);
  return outputPath;
}
