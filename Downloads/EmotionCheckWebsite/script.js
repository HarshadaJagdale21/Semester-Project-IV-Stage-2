// Emotion Check AI - Frontend Logic & AWS Integration

// Default Fallback APIs (based on AWS API Gateway example)
const DEFAULT_UPLOAD_API = "https://1un5t6ql1i.execute-api.ap-south-1.amazonaws.com/prod/upload";
const DEFAULT_EMOTION_API = "https://1un5t6ql1i.execute-api.ap-south-1.amazonaws.com/prod/emotions";
const DEFAULT_HAPPIEST_API = "https://1un5t6ql1i.execute-api.ap-south-1.amazonaws.com/prod/happiest";

// Active API endpoints state
let uploadAPI = localStorage.getItem("uploadAPI") || DEFAULT_UPLOAD_API;
let emotionAPI = localStorage.getItem("emotionAPI") || DEFAULT_EMOTION_API;
let happiestAPI = localStorage.getItem("happiestAPI") || DEFAULT_HAPPIEST_API;

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const btnUpload = document.getElementById("btnUpload");
const capturedPreview = document.getElementById("capturedPreview");
const captureFlash = document.getElementById("captureFlash");

let imageBase64 = "";

// Initialize Camera Feed
function initCamera() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
        .then(stream => {
            video.srcObject = stream;
            showToast("Camera stream successfully connected.", "info");
        })
        .catch(err => {
            console.error("Camera access error: ", err);
            showToast("Camera access denied or unavailable. Using simulated camera input.", "error");
            // Set up fallback placeholder view inside video container if camera fails
            setupCameraFallback();
        });
    } else {
        showToast("Browser does not support camera access.", "error");
        setupCameraFallback();
    }
}

// Fallback when webcam is unavailable
function setupCameraFallback() {
    video.style.display = "none";
    const container = document.querySelector(".camera-container");
    
    const fallbackMessage = document.createElement("div");
    fallbackMessage.style.position = "absolute";
    fallbackMessage.style.top = "0";
    fallbackMessage.style.left = "0";
    fallbackMessage.style.width = "100%";
    fallbackMessage.style.height = "100%";
    fallbackMessage.style.display = "flex";
    fallbackMessage.style.flexDirection = "column";
    fallbackMessage.style.justifyContent = "center";
    fallbackMessage.style.alignItems = "center";
    fallbackMessage.style.background = "#0c0822";
    fallbackMessage.style.padding = "20px";
    fallbackMessage.style.textAlign = "center";
    fallbackMessage.innerHTML = `
        <span style="font-size: 3rem; margin-bottom: 12px; filter: drop-shadow(0 0 10px rgba(140,82,255,0.4))">📷</span>
        <h3 style="font-size: 1rem; color: #fff; margin-bottom: 8px;">Webcam Stream Offline</h3>
        <p style="font-size: 0.8rem; color: #8c86b2; max-width: 250px;">Please check permissions. Click "Capture Photo" to use a mock smile face for testing.</p>
    `;
    container.appendChild(fallbackMessage);
}

// Capture Photo
function capture() {
    // Flash Animation Effect
    captureFlash.classList.add("active");
    setTimeout(() => {
        captureFlash.classList.remove("active");
    }, 400);

    // Check if camera stream is active
    if (video.srcObject) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        
        // Mirror back the frame coordinate draw to align with screen
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0);
        
        // Restore context state
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        imageBase64 = canvas.toDataURL("image/jpeg").split(",")[1];
        
        // Display inside thumbnail preview
        capturedPreview.style.backgroundImage = `url(data:image/jpeg;base64,${imageBase64})`;
        capturedPreview.classList.add("show");
    } else {
        // Fallback simulated happy image base64 (small red-dot image or simple smiley placeholder data url)
        // Here we use a tiny 1x1 grey pixel as raw fallback data to avoid code crashes.
        imageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        capturedPreview.style.backgroundImage = "radial-gradient(circle, #ffe066 0%, #ffd700 100%)";
        capturedPreview.classList.add("show");
        showToast("Captured mock photo data.", "info");
    }

    // Enable upload button
    btnUpload.removeAttribute("disabled");
    
    // Conforming alert requested by Step 12.4
    alert("Photo Captured");
}

// Upload & Process
async function upload() {
    const personName = document.getElementById("personName").value.trim();

    if (!personName) {
        showToast("Please enter a name first.", "error");
        document.getElementById("personName").focus();
        return;
    }

    if (!imageBase64) {
        showToast("Please capture a photo first.", "error");
        return;
    }

    if (uploadAPI.includes("YOUR_API_ID")) {
        showToast("AWS API Endpoints have not been configured yet. Update them in the settings panel below.", "error");
        return;
    }

    // Visual button upload loading state
    btnUpload.innerHTML = `<span class="btn-icon">⏳</span> Uploading...`;
    btnUpload.setAttribute("disabled", "true");
    document.getElementById("btnCapture").setAttribute("disabled", "true");

    try {
        const response = await fetch(uploadAPI, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                personName: personName,
                image: imageBase64
            })
        });

        if (!response.ok) {
            throw new Error(`Upload failed with status ${response.status}`);
        }

        const result = await response.json();
        
        // Show successful upload alert
        alert(result.message || "Upload completed successfully!");
        showToast("AWS analysis completed successfully.", "success");

        // Reload data
        loadData();
        loadHappiest();

    } catch (error) {
        console.error("Upload error:", error);
        showToast("API Upload Failed: " + error.message, "error");
        alert("Upload Failed: " + error.message);
    } finally {
        // Reset button states
        btnUpload.innerHTML = `<span class="btn-icon">⬆️</span> Upload & Analyze`;
        btnUpload.removeAttribute("disabled");
        document.getElementById("btnCapture").removeAttribute("disabled");
    }
}

// Fetch all database records
async function loadData() {
    const tableBody = document.getElementById("tableBody");
    
    if (emotionAPI.includes("YOUR_API_ID")) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="3" class="table-empty">
                    API endpoint placeholder detected. Please configure actual API in Settings below.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = `
        <tr>
            <td colspan="3" class="table-empty">
                <span class="btn-icon" style="display:inline-block; animation: float 1s infinite">⏳</span> Fetching latest data from DynamoDB...
            </td>
        </tr>
    `;

    try {
        const response = await fetch(emotionAPI);
        
        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}`);
        }
        
        const data = await response.json();
        
        // Match table rebuild structure in index.html (headers stay in standard elements, we replace tableBody)
        tableBody.innerHTML = "";

        if (!data || data.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="3" class="table-empty">No emotion records found in DynamoDB database.</td>
                </tr>
            `;
            return;
        }

        // Keep direct visual compatible mapping with HTML table headers: Name, Emotion, Confidence
        data.forEach(item => {
            const emotionClass = getEmotionClass(item.Emotion);
            const emotionEmoji = getEmotionEmoji(item.Emotion);
            const confVal = parseFloat(item.Confidence).toFixed(1);

            const row = document.createElement("tr");
            row.innerHTML = `
                <td style="font-weight: 600;">${escapeHtml(item.PersonName)}</td>
                <td>
                    <span class="emotion-badge ${emotionClass}">
                        <span>${emotionEmoji}</span> ${escapeHtml(item.Emotion)}
                    </span>
                </td>
                <td>
                    <div class="confidence-bar-cell">
                        <span class="confidence-val">${confVal}%</span>
                        <div class="confidence-mini-bar">
                            <div class="confidence-fill" style="width: ${confVal}%"></div>
                        </div>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });

        showToast("Records refreshed successfully.", "success");

    } catch (error) {
        console.error("Fetch data error:", error);
        showToast("Failed to fetch records: " + error.message, "error");
        tableBody.innerHTML = `
            <tr>
                <td colspan="3" class="table-empty" style="color: var(--accent-danger)">
                    ⚠️ Failed to load records: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Fetch Happiest Person
async function loadHappiest() {
    const container = document.getElementById("happiest");

    if (happiestAPI.includes("YOUR_API_ID")) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Configure API settings to load the happiest person.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="empty-state">
            <span style="font-size: 1.5rem; display:inline-block; animation: float 1s infinite">👑</span>
            <p>Scanning leaderboard...</p>
        </div>
    `;

    try {
        const response = await fetch(happiestAPI);
        
        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}`);
        }
        
        const person = await response.json();

        if (!person || !person.PersonName) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No happy individuals detected yet in the records!</p>
                </div>
            `;
            return;
        }

        const confVal = parseFloat(person.Confidence).toFixed(1);
        const emotionEmoji = getEmotionEmoji(person.Emotion);
        
        container.innerHTML = `
            <div class="happiest-profile">
                <div class="happiest-avatar" title="${person.Emotion}">
                    ${emotionEmoji}
                </div>
                <div class="happiest-details">
                    <h3 class="happiest-name">${escapeHtml(person.PersonName)}</h3>
                    <div class="happiest-emotion-row">
                        <span class="happiest-label-badge">${escapeHtml(person.Emotion)}</span>
                        <span class="happiest-percent">${confVal}% confidence</span>
                    </div>
                    <div class="happiest-score-bar-container">
                        <div id="happyScoreBar" class="happiest-score-bar" style="width: 0%"></div>
                    </div>
                </div>
            </div>
        `;

        // Smooth transition score trigger
        setTimeout(() => {
            const happyScoreBar = document.getElementById("happyScoreBar");
            if (happyScoreBar) {
                happyScoreBar.style.width = `${confVal}%`;
            }
        }, 100);

        showToast("Happiest person loaded!", "success");

    } catch (error) {
        console.error("Fetch happiest error:", error);
        showToast("Failed to fetch happiest: " + error.message, "error");
        container.innerHTML = `
            <div class="empty-state" style="color: var(--accent-danger)">
                <p>⚠️ Error querying happiest person endpoint.</p>
            </div>
        `;
    }
}

// Utility Helpers
function getEmotionClass(emotion) {
    if (!emotion) return "default";
    const e = emotion.toLowerCase();
    if (e.includes("happy")) return "happy";
    if (e.includes("sad")) return "sad";
    if (e.includes("angry")) return "angry";
    if (e.includes("calm")) return "calm";
    if (e.includes("surpris")) return "surprised";
    return "default";
}

function getEmotionEmoji(emotion) {
    if (!emotion) return "😐";
    const e = emotion.toLowerCase();
    if (e.includes("happy")) return "😊";
    if (e.includes("sad")) return "😢";
    if (e.includes("angry")) return "😠";
    if (e.includes("calm")) return "😌";
    if (e.includes("surpris")) return "😲";
    if (e.includes("fear")) return "😨";
    if (e.includes("disgust")) return "🤢";
    if (e.includes("confus")) return "🤔";
    return "😐";
}

function escapeHtml(string) {
    return String(string)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Toast Notifications System
function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    let icon = "🔔";
    if (type === "success") icon = "✅";
    if (type === "error") icon = "❌";
    if (type === "info") icon = "💡";

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-msg">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(toast);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
        toast.style.animation = "slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) reverse forwards";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// API Configuration Management
function loadApiInputsFromState() {
    document.getElementById("uploadApiInput").value = uploadAPI;
    document.getElementById("emotionApiInput").value = emotionAPI;
    document.getElementById("happiestApiInput").value = happiestAPI;
    updateConfigBadge();
}

function updateConfigBadge() {
    const badge = document.getElementById("apiStatusBadge");
    if (uploadAPI.includes("YOUR_API_ID") || emotionAPI.includes("YOUR_API_ID") || happiestAPI.includes("YOUR_API_ID")) {
        badge.textContent = "Configuration Needed";
        badge.className = "status-badge alert";
    } else {
        badge.textContent = "Custom Connection Live";
        badge.className = "status-badge";
    }
}

function saveApiConfig() {
    const up = document.getElementById("uploadApiInput").value.trim();
    const em = document.getElementById("emotionApiInput").value.trim();
    const hp = document.getElementById("happiestApiInput").value.trim();

    if (!up || !em || !hp) {
        showToast("All configuration endpoints must be filled.", "error");
        return;
    }

    uploadAPI = up;
    emotionAPI = em;
    happiestAPI = hp;

    localStorage.setItem("uploadAPI", uploadAPI);
    localStorage.setItem("emotionAPI", emotionAPI);
    localStorage.setItem("happiestAPI", happiestAPI);

    updateConfigBadge();
    showToast("AWS API endpoints updated successfully!", "success");
    
    // Refresh display
    loadData();
    loadHappiest();
}

function resetApiConfig() {
    uploadAPI = DEFAULT_UPLOAD_API;
    emotionAPI = DEFAULT_EMOTION_API;
    happiestAPI = DEFAULT_HAPPIEST_API;

    localStorage.removeItem("uploadAPI");
    localStorage.removeItem("emotionAPI");
    localStorage.removeItem("happiestAPI");

    loadApiInputsFromState();
    showToast("Endpoints reset to default values.", "info");

    loadData();
    loadHappiest();
}

// Initialize on Load
window.addEventListener("DOMContentLoaded", () => {
    initCamera();
    loadApiInputsFromState();
    
    // Call API loads on startup
    loadData();
    loadHappiest();
});
