async function openFilePicker() {
  const res = await fetch("/get-user-file-path");
  const data = await res.json();
  const input = document.getElementById("ffmpeg-path-holder");

  if (res.ok) {
    input.value = data.path;
    updateInputWidth(input); // Trigger resize

  } else {
    document.getElementById("ffmpeg-info").textContent = "Something went wrong fetching the set file path";
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

function setFfmpegPath(newPath) {

  fetch("/set-ffmpeg-path", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ path: newPath })
  })
    .then(res => {
      if (res.ok) {
        document.getElementById("ffmpeg-info").textContent = "Path set successfully!";
      } else {
        document.getElementById("ffmpeg-info").textContent = "Failed to set FFmpeg path.";
      }
    })
    .catch(err => {
      console.error("Error setting path:", err);
      document.getElementById("ffmpeg-info").textContent = "Error communicating with server.";
    });
}

async function setCurrentFilePathFromConfig() {
  const response = await fetch("/get-ffmpeg-path");
  const data = await response.json();

  const input = document.getElementById("ffmpeg-path-holder");
  input.value = data.path;
  updateInputWidth(input); // Trigger resize
}

function enableAutoResizeInput(inputElement, minWidth = 200, padding = 20) {
  const measurer = document.createElement("span");
  measurer.style.position = "absolute";
  measurer.style.visibility = "hidden";
  measurer.style.whiteSpace = "pre";
  measurer.style.font = getComputedStyle(inputElement).font;
  document.body.appendChild(measurer);

  function update() {
    measurer.textContent = inputElement.value || inputElement.placeholder;
    inputElement.style.width = Math.max(measurer.offsetWidth + padding, minWidth) + "px";
  }

  inputElement.addEventListener("input", update);
  update(); // initial run

  // Attach for reuse
  inputElement._resizeHandler = update;
}

// Optional: expose if called from elsewhere
function updateInputWidth(inputElement) {
  if (inputElement && inputElement._resizeHandler) {
    inputElement._resizeHandler();
  }
}

window.onload = function () {
  setCurrentFilePathFromConfig();
  const input = document.getElementById("ffmpeg-path-holder");
  enableAutoResizeInput(input);
};