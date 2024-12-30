const categories = ['1-kick', '2-snare', '3-perc', '4-fx', '5-bass', '6-lead', '7-arpeggio', '8-chord'];
const confirmButton = document.getElementById('confirm-changes');

// Temporary object to hold pending changes for each category
const pendingChanges = {
    '1-kick': {},
    '2-snare': {},
    '3-perc': {},
    '4-fx': {},
    '5-bass': {},
    '6-lead': {},
    '7-arpeggio': {},
    '8-chord': {}
};

let tempDir = "";

categories.forEach(category => {
    const slotsContainer = document.getElementById(category);



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

                // Create a temp directory if it doesn't exist
                tempDir = path.join(os.tmpdir(), 'sample-manager-temp');
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir);
                }

                const reader = new FileReader();
                reader.onload = function (event) {
                    const arrayBuffer = event.target.result;
                    const buffer = Buffer.from(arrayBuffer);

                    // Copy the file to the temp directory
                    const tempFilePath = path.join(tempDir, droppedFile.name);
                    fs.writeFileSync(tempFilePath, buffer);

                    ipcRenderer.send('file-dropped', tempFilePath);

                    // Display the file name in the slot
                    slotElement.textContent = droppedFile.name;
                    slotElement.classList.add('filled');

                    // Save the change to the correct category in pendingChanges
                    pendingChanges[category][slotNumber] = tempFilePath;
                    console.log(`Slot ${slotNumber} in category ${category} updated with ${tempFilePath}`);
                };
                reader.readAsArrayBuffer(droppedFile);
            }
        }
    });
});

// Handle confirm button click/sync files to op-z
confirmButton.addEventListener('click', () => {
    for (const [category, changes] of Object.entries(pendingChanges)) {
        for (const [slot, newFilePath] of Object.entries(changes)) {
            console.log(`Applying changes for slot ${slot} in category ${category}`);
            const formattedSlot = String(slot).padStart(2, '0'); // Pads single digits with a leading zero
            const destinationFolder = path.join(opzpath, 'samplepacks', category, `${formattedSlot}`); // Adjust for actual path

            // Remove all existing files in the slot directory
            const existingFiles = fs.readdirSync(destinationFolder);
            existingFiles.forEach(file => {
                fs.unlinkSync(path.join(destinationFolder, file));
            });

            // If the entry is 'xxx', skip copying the new file
            if (newFilePath !== 'xxx') {
                // Copy the new file to the slot
                fs.copyFileSync(newFilePath, path.join(destinationFolder, path.basename(newFilePath)));
                console.log(`Slot ${slot} in category ${category} updated with ${newFilePath}`);
            }

            console.log(`Slot ${slot} in category ${category} updated with ${newFilePath}`);
        }
    }

    // Clear pendingChanges after applying
    for (const category in pendingChanges) {
        pendingChanges[category] = {};
    }

    //remove temp directory
    if (fs.existsSync(tempDir)) {
        fs.rmdirSync(tempDir, { recursive: true });
    }

    alert('Changes confirmed and saved!');

    listFiles();
});

function addToPendingChanges(category, slot, filePath) {
    console.log(`Adding ${filePath} to pending changes for slot ${slot} in category ${categories[category]}`);
    pendingChanges[categories[category]][slot] = filePath;
}