function setupDragDrop(id, type) {
    const dropArea = document.getElementById(id);

    dropArea.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropArea.classList.add('dragover');
    });

    dropArea.addEventListener('dragleave', (event) => {
        event.preventDefault();
        dropArea.classList.remove('dragover');
    });

    dropArea.addEventListener('drop', async (event) => {
        event.preventDefault();
        dropArea.classList.remove('dragover');

        const files = event.dataTransfer.files;

        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', type); // "drum" or "synth"

            const response = await fetch('/convert', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            alert(result.message || "Conversion done!");
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupDragDrop('drum-samples', 'drum');
    setupDragDrop('synth-samples', 'synth');
});