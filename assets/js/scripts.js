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

    const activeLists = lists.filter(list => !list.closed);

    const listIdToName = {};
    activeLists.forEach(list => {
      listIdToName[list.id] = list.name;
    });

    const rows = cards
      .filter(card => !card.closed && listIdToName[card.idList])
      .map(card => {

        const labels = (card.labels || [])
          .map(label => label.name)
          .filter(Boolean);

        return {
          Id: card.idShort || "",
          Title: card.name || "",
          Description: card.desc || "",
          Column: listIdToName[card.idList] || "",
          "Tag 1": labels[0] || "",
          "Tag 2": labels[1] || "",
          "Tag 3": labels[2] || "",
          "Tag 4": labels[3] || ""
        };
      });

    const worksheet = XLSX.utils.json_to_sheet(rows);

    const csv = XLSX.utils.sheet_to_csv(worksheet, {
      FS: ","
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