const button = document.getElementById("convert");
const fileInput = document.getElementById("file");

button.addEventListener("click", async () => {
  const file = fileInput.files[0];

  if (!file) {
    alert("Selecione um arquivo JSON");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    button.disabled = true;
    button.innerText = "Converting...";

    const response = await fetch("/api/convert", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Erro ao converter arquivo");
    }

    const blob = await response.blob();
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trello.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

  } catch (err) {
    console.error(err);
    alert("Falha ao converter o arquivo");
  } finally {
    button.disabled = false;
    button.innerText = "Convert";
  }
});
