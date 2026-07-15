const API_URL = "https://zj82fy3f2l.execute-api.ap-south-1.amazonaws.com/prod";

// Upload Image to Telemetry Node
async function uploadImage() {
    const file = document.getElementById("imageInput").files[0];
    const messageEl = document.getElementById("message");

    if (!file) {
        alert("Please select an image payload before initialization.");
        return;
    }

    // Activating processing visual response state
    messageEl.className = "";
    messageEl.style.display = "block";
    messageEl.style.color = "var(--text-secondary)";
    messageEl.innerHTML = "Processing neural execution metrics...";

    const reader = new FileReader();
    reader.onload = async function () {
        const base64Image = reader.result.split(",")[1];

        try {
            const response = await fetch(API_URL + "/upload", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    image: base64Image
                })
            });

            const result = await response.json();
            
            // Apply professional alert styling context
            messageEl.className = "success";
            messageEl.innerHTML = result.message || "Payload Ingested Successfully";

            // Reset File input elements
            document.getElementById("imageInput").value = "";
            document.getElementById("fileNamePreview").innerText = "";

            // Dynamic view synchronization
            loadAnimals();

        } catch (error) {
            messageEl.className = "error";
            messageEl.innerHTML = "Node Communication Error: Processing Failed";
            console.error(error);
        }
    };

    reader.readAsDataURL(file);
}

// Load and Render Dashboard Analytics
async function loadAnimals() {
    try {
        const response = await fetch(API_URL + "/animals");
        const animals = await response.json();
        const table = document.getElementById("animalTable");

        table.innerHTML = "";

        if (!animals || animals.length === 0) {
            table.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-secondary); padding: 40px;">No telemetry records identified in this active deployment vector.</td></tr>`;
            return;
        }

        animals.forEach(animal => {
            // Ensure proper numeric parsing for confidence metric structures
            const confValue = parseFloat(animal.Confidence) || 0;

            table.innerHTML += `
            <tr>
                <td><span class="animal-tag">${animal.AnimalName}</span></td>
                <td><span class="count-badge">${animal.DetectionCount}</span></td>
                <td>
                    <div class="confidence-container">
                        <div class="confidence-bar-bg">
                            <div class="confidence-bar-fill" style="width: ${confValue}%"></div>
                        </div>
                        <span class="confidence-text">${confValue}%</span>
                    </div>
                </td>
                <td><span class="timestamp">${animal.LastSeen}</span></td>
                <td>
                    <div class="img-container">
                        <img src="${animal.ImageURL}" alt="${animal.AnimalName}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2254%22><rect width=%22100%%22 height=%22100%%22 fill=%22%23242C3F%22/><text x=%2250%%22 y=%2250%%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%239CA3AF%22 font-size=%2210%22>Missing</text></svg>'">
                    </div>
                </td>
            </tr>
            `;
        });
    } catch (e) {
        console.error("Dashboard synchronization error:", e);
    }
}

// Automatically load elements when page loads safely
document.addEventListener("DOMContentLoaded", () => {
    loadAnimals();
});