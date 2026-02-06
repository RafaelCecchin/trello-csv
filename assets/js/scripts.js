const button = document.getElementById("convert");
const fileInput = document.getElementById("file");

button.addEventListener("click", async () => {
  const file = fileInput.files[0];

  if (!file) {
    alert("Selecione um arquivo JSON do Trello");
    return;
  }

  button.disabled = true;
  button.innerText = "Converting...";

  try {
    const text = await file.text();
    const jsonData = JSON.parse(text);

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
      if (!listName || !columns[listName]) return;

      let text = card.name;

      if (Array.isArray(card.labels) && card.labels.length > 0) {
        card.labels.forEach(label => {
          if (label.name) {
            text += ` | ${label.name}`;
          }
        });
      }

      columns[listName].push(text);
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
    
    const csv = XLSX.utils.sheet_to_csv(worksheet, {
      FS: ";"
    });
    
    const blob = new Blob(
      ["\ufeff" + csv],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trello.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

  } catch (err) {
    console.error(err);
    alert("Erro ao processar o arquivo. JSON inválido?");
  } finally {
    button.disabled = false;
    button.innerText = "Convert";
  }
});
