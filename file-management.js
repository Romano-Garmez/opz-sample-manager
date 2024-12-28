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
            console.log("fullPath: " + fullPath);
            let slot = parseInt(path.basename(path.dirname(fullPath)), 10);
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

