
let slotname = '1-kick';

const slotsContainer = document.getElementById(slotname);
const confirmButton = document.getElementById('confirm-changes');

// Temporary object to hold pending changes
const pendingChanges = {};

// Handle drag-and-drop for slots
slotsContainer.addEventListener('dragover', (event) => {
    event.preventDefault();
    if (event.target.classList.contains('sampleslot')) {
        event.target.classList.add('dragover');
    }
});

slotsContainer.addEventListener('dragleave', (event) => {
    if (event.target.classList.contains('sampleslot')) {
        event.target.classList.remove('dragover');
    }
});

slotsContainer.addEventListener('drop', (event) => {
    event.preventDefault();
    const slotElement = event.target;

    if (slotElement.classList.contains('sampleslot')) {
        slotElement.classList.remove('dragover');

        console.log(event.dataTransfer.files);

        const droppedFile = event.dataTransfer.files[0];
        if (droppedFile) {
            const slotNumber = slotElement.dataset.slot;

            // Display the file name in the slot
            slotElement.textContent = droppedFile.name;

            // Save the change to pendingChanges
            pendingChanges[slotNumber] = droppedFile.path;
            console.log(`Slot ${slotNumber} updated with ${droppedFile.path}`);
        }
    }
});

// Handle confirm button click
confirmButton.addEventListener('click', () => {
    for (const [slot, newFilePath] of Object.entries(pendingChanges)) {
        console.log(`Applying changes for slot ${slot} `);
        const formattedSlot = String(slot).padStart(2, '0'); // Pads single digits with a leading zero
        const destinationFolder = path.join(opzpath, 'samplepacks', slotname, `${formattedSlot}`); // Adjust for actual path
        const currentFile = fs.readdirSync(destinationFolder)[0]; // Assuming one file per slot

        // Remove the existing file
        if (currentFile) {
            fs.unlinkSync(path.join(destinationFolder, currentFile));
        }

        // Copy the new file to the slot
        fs.copyFileSync(newFilePath, path.join(destinationFolder, path.basename(newFilePath)));

        console.log(`Slot ${slot} updated with ${newFilePath}`);
    }

    // Clear pendingChanges after applying
    Object.keys(pendingChanges).forEach((key) => delete pendingChanges[key]);

    alert('Changes confirmed and saved!');
});
