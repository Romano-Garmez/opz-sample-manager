//handle clicking select op-z drive button

const { get } = require('http');

let opzpath = "";

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
        console.log("samplepackdiv: " + samplepackdiv);

        if (samplepackdiv) {
            // If the element is found, update its innerHTML
            samplepackdiv.innerHTML = listSamples(path.join(opzpath, 'samplepacks', samplepackfolders[sampletype])).join('<br>');
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
    let sampleFiles = [];

    files.forEach(file => {
        const fullPath = path.join(dirPath, file);  // Get the full path of the current file/folder
        const stats = fs.statSync(fullPath);  // Get stats to determine if it's a file or folder

        if (stats.isDirectory()) {
            // If it's a directory, recursively list files inside it
            sampleFiles = sampleFiles.concat(listSamples(fullPath));
        } else if (stats.isFile() && (file.endsWith('.aif') || file.endsWith('.aiff'))) {
            // If it's a file and ends with .aif, add it to the sample list
            sampleFiles.push(file);
        }
    });

    return sampleFiles;
}