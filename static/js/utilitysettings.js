async function openFilePicker() {
    const res = await fetch("/get-user-file-path");
    document.getElementById("result").textContent = "Look behind the app for the file browser lol.";
    const data = await res.json();
    if (res.ok) {
      document.getElementById("result").textContent = "Selected path: " + data.path;
    } else {
      document.getElementById("result").textContent = "Cancelled";
    }
  }