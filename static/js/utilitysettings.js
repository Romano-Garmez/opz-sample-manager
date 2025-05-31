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

  function resetConfig() {  
  fetch('/reset-config', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        // Optionally show a message or reload the page
        alert('Config reset! Please restart the app.');
        window.location.reload();
    })
    .catch(error => {
        alert('Error resetting config.');
        console.error(error);
    });
}