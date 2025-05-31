async function fetchOpzSamples() {
    try {
        const response = await fetch("http://localhost:5000/read-samples");
        if (!response.ok) {
            throw new Error("Network response was not ok: " + response.statusText);
        }
        const data = await response.json();

        // Clear existing slots
        data.categories.forEach((category, catIndex) => {
            const container = document.getElementById(category);
            container.innerHTML = ""; // clear previous content

            data.sampleData[catIndex].forEach((slot, slotIndex) => {
                const slotDiv = document.createElement("div");
                slotDiv.classList.add("sampleslot");
                slotDiv.setAttribute("draggable", "true");
                slotDiv.dataset.category = category;
                slotDiv.dataset.slot = slotIndex;

                // Enable dragging from this slot
                slotDiv.addEventListener("dragstart", (e) => {
                    e.dataTransfer.setData("text/plain", JSON.stringify({
                        category,
                        slot: slotIndex,
                        path: slot.path
                    }));
                });

                // Allow dropping into another slot
                slotDiv.addEventListener("dragover", (e) => {
                    e.preventDefault();
                    slotDiv.classList.add("drag-hover");
                });

                slotDiv.addEventListener("dragleave", () => {
                    slotDiv.classList.remove("drag-hover");
                });

                slotDiv.addEventListener("drop", async (e) => {
                    e.preventDefault();
                    slotDiv.classList.remove("drag-hover");

                    const droppedData = JSON.parse(e.dataTransfer.getData("text/plain"));
                    const fromPath = droppedData.path;

                    if (!fromPath || (droppedData.category === category && droppedData.slot == slotIndex)) return;

                    const formData = new FormData();
                    formData.append("source_path", fromPath);
                    formData.append("target_category", category);
                    formData.append("target_slot", slotIndex);

                    try {
                        const response = await fetch("http://localhost:5000/move-sample", {
                            method: "POST",
                            body: formData
                        });

                        if (!response.ok) throw new Error("Move failed");

                        // Refresh the entire UI to reflect all changes
                        await fetchOpzSamples();
                    } catch (err) {
                        console.error("Failed to move sample:", err);
                        alert("Could not move sample.");
                    }
                });

                // Display sample info
                const filename = slot.filename || "(empty)";
                const filesize = slot.filesize ? ` (${(slot.filesize / 1024).toFixed(1)} KB)` : "";
                const text = document.createElement("span");
                text.textContent = `Slot ${slotIndex + 1}: ${filename}${filesize}`;

                // Delete button
                const deleteBtn = document.createElement("button");
                deleteBtn.textContent = "✕";
                deleteBtn.classList.add("delete-btn");
                deleteBtn.onclick = async () => {
                    const samplePath = slot.path;
                    if (!samplePath) return;

                    const confirmed = confirm(`Delete sample?\n${samplePath}`);
                    if (!confirmed) return;

                    try {
                        const res = await fetch("http://localhost:5000/delete-sample", {
                            method: "DELETE",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({ path: samplePath })
                        });

                        if (!res.ok) throw new Error("Delete failed");

                        slot.path = null;
                        text.textContent = `Slot ${slotIndex + 1}: (empty)`;
                    } catch (err) {
                        console.error("Failed to delete sample:", err);
                        alert("Could not delete sample.");
                    }
                };

                slotDiv.appendChild(text);
                slotDiv.appendChild(deleteBtn);
                container.appendChild(slotDiv);
            });
        });

    } catch (error) {
        console.error("Failed to fetch OP-Z samples:", error);
    }
}


document.querySelectorAll(".samplepackbox").forEach(box => {
    box.addEventListener("dragover", (e) => {
        e.preventDefault(); // allow drop
    });

    box.addEventListener("drop", async (e) => {
        e.preventDefault();

        const files = e.dataTransfer.files;
        if (files.length === 0) return;

        const file = files[0]; // assume only one file for now
        const category = box.id;

        // Find the nearest .sampleslot under the cursor
        const slotElement = document.elementFromPoint(e.clientX, e.clientY)?.closest(".sampleslot");
        if (!slotElement) return;

        const slot = slotElement.dataset.slot;

        // Upload the file to the backend
        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", category);
        formData.append("slot", slot);

        try {
            const response = await fetch("http://localhost:5000/upload-sample", {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                throw new Error("Upload failed");
            }

            const result = await response.json();
            slotElement.querySelector("span").textContent = `Slot ${parseInt(slot) + 1}: ${result.path}`;
        } catch (err) {
            console.error("Failed to upload file:", err);
            alert("Upload failed.");
        }
    });
});

async function pollForMount(retries = 60, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch('/get-opz-mount-path');
            const data = await res.json();

            if (data["OPZ_MOUNT_PATH"]) {
                await fetchOpzSamples();
                return;
            }
        } catch (err) {
            console.error("Failed to check mount path:", err);
        }
        await new Promise(r => setTimeout(r, delay));
    }

    console.warn("Mount path not found after polling.");
}
pollForMount();