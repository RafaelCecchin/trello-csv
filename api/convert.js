import { IncomingForm } from "formidable";
import fs from "fs";
import XLSX from "xlsx";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = new IncomingForm({
    multiples: false,
  });

  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(500).json({ error: "Upload failed" });
    }

    const file = files.file?.[0];

    if (!file || !file.filepath) {
      return res.status(400).json({ error: "File not received" });
    }

    try {
      const jsonContent = fs.readFileSync(file.filepath, "utf-8");
      const jsonData = JSON.parse(jsonContent);

      const lists = jsonData.lists || [];
      const cards = jsonData.cards || [];
      
      const listIdToName = {};
      lists.forEach(list => {
        listIdToName[list.id] = list.name;
      });
      
      const columns = {};
      lists.forEach(list => {
        columns[list.name] = [];
      });

      cards.forEach(card => {
        const listName = listIdToName[card.idList];
        if (listName && columns[listName]) {
          columns[listName].push(card.name);
        }
      });
      
      const maxRows = Math.max(
        ...Object.values(columns).map(col => col.length),
        0
      );
      
      const rows = [];

      for (let i = 0; i < maxRows; i++) {
        const row = {};
        for (const columnName of Object.keys(columns)) {
          row[columnName] = columns[columnName][i] || "";
        }
        rows.push(row);
      }
      
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Trello");

      const buffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
      });

      // 📤 Retorna para download
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="trello.xlsx"'
      );

      return res.status(200).send(buffer);
    } catch (error) {
      console.error("Conversion error:", error);
      return res.status(500).json({ error: "Invalid Trello JSON file" });
    }
  });
}
