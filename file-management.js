//handle clicking select op-z drive button

const { get } = require('http');

let opzpath = "";
const numslots = 10;

const selectDriveBtn = document.getElementById('select-drive');
const listFilesBtn = document.getElementById('list-files');

selectDriveBtn.addEventListener('click', async () => {
    // Open the dialog to select a directory
    const result = await ipcRenderer.invoke('dialog:open');

    if (result && result.length > 0) {
        opzpath = result[0];

        document.getElementById('opz-path').innerText = opzpath;
        printFiles(opzpath);
    }
});

listFilesBtn.addEventListener('click', async () => {
    // Open the dialog to select a directory
    const samplepackdirectory = path.join(opzpath, 'samplepacks');
    const samplepackfolders = getFilesInDir(samplepackdirectory);
    console.log("samplepackfolders: " + samplepackfolders);

    for (let sampletype in samplepackfolders) {
        console.log("current sample type: " + samplepackfolders[sampletype]);
        let samplepackdiv = document.getElementById(samplepackfolders[sampletype]);

        if (samplepackdiv) {
            // If the element is found, update its innerHTML

            let samplelist = listSamples(path.join(opzpath, 'samplepacks', samplepackfolders[sampletype]));
            //samplepackdiv.innerHTML = listSamples(path.join(opzpath, 'samplepacks', samplepackfolders[sampletype])).join('<br>');
            console.log("samplelist: " + samplelist);

            for (let i = 1; i <= numslots; i += 1) {
                let newdiv = document.createElement('div');
                samplepackdiv.appendChild(newdiv);
                newdiv.className = "sampleslot";
                newdiv.id = i;
                newdiv.dataset.slot = i; // Set the slot number as a data attribute


                if (samplelist[i] != undefined) {
                    newdiv.innerHTML = samplelist[i];
                }
                else {
                    newdiv.innerHTML = "empty";
                }
            }
        } else {
            // Log if element is not found
            console.error("Element not found for sampletype:", samplepackfolders[sampletype]);
        }
    }

});

function printFiles(directory) {
    const fs = require('fs');
    const files = fs.readdirSync(directory);

    // Print the contents to the web console
    console.log(files);

}

function getFilesInDir(directory) {
    const fs = require('fs');
    const files = fs.readdirSync(directory);

    // Print the contents to the web console
    return files;
}

// Function to recursively list all .aiff files in a directory
function listSamples(dirPath) {
    const files = fs.readdirSync(dirPath);  // Get all files and folders in the current directory
    const sampleArray = new Array(numslots + 1).fill("");
    
    files.forEach(file => {
        const fullPath = path.join(dirPath, file);  // Get the full path of the current file/folder
        const stats = fs.statSync(fullPath);  // Get stats to determine if it's a file or folder

        if (stats.isDirectory()) {
            // If it's a directory, recursively list files inside it
            const nestedSamples = listSamples(fullPath);
            nestedSamples.forEach((nestedFile, index) => {
                if (nestedFile) {
                    sampleArray[index] = nestedFile;
                }
            });
        } else if (stats.isFile() && (file.endsWith('.aif') || file.endsWith('.aiff'))) {
            // Get slot #
            let slot = parseInt(fullPath.split('\\')[fullPath.split('\\').length - 2], 10);
            console.log("file: " + file + " slot: " + slot);

            // If it's a file and ends with .aif, add it to the sample list
            if (slot >= 0 && slot < numslots + 1) {
                sampleArray[slot] = file;
            }
        }
    });

    console.log("sampleArray: ", sampleArray);  // Log the sampleArray to debug

    return sampleArray;
}


var slotname = '1-kick';

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
