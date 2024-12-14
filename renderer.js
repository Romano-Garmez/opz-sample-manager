const { ipcRenderer } = require('electron');

const slotsContainer = document.getElementById('slots-container');

slotsContainer.addEventListener('dragover', (event) => {
    event.preventDefault();
});

slotsContainer.addEventListener('drop', (event) => {
    event.preventDefault();

    const slotElement = event.target;

    if (slotElement.classList.contains('sampleslot')) {
        const slotNumber = slotElement.dataset.slot;
        const droppedFile = event.dataTransfer.files[0];

        if (droppedFile) {
            slotElement.textContent = droppedFile.name;
            ipcRenderer.send('file-dropped', droppedFile.path, slotNumber);
        }
    }
});
