// Replace with your API Gateway Invoke URL
const API_URL = "https://2mx42rztqa.execute-api.ap-south-1.amazonaws.com";

// Upload Story
async function uploadStory() {
    const titleInput = document.getElementById("title");
    const storyInput = document.getElementById("story");
    const uploadBtn = document.getElementById("upload-btn");

    const title = titleInput.value.trim();
    const story = storyInput.value.trim();

    if (title === "" || story === "") {
        alert("Please enter both a title and your story text.");
        return;
    }

    // Visual feedback: Disable button and show loading state
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = "<span>Generating audio... Please wait</span>";

    try {
        const response = await fetch(`${API_URL}/upload`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: title,
                story: story
            })
        });

        if (!response.ok) {
            throw new Error("Failed to process your story. Please try again.");
        }

        const result = await response.json();
        alert(result.message || "Story generated successfully!");

        // Clear input fields
        titleInput.value = "";
        storyInput.value = "";

        // Reload feed
        await loadStories();

    } catch (error) {
        console.error(error);
        alert(error.message || "An unexpected error occurred.");
    } finally {
        // Restore button state
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = "<span>Generate Speech Audio</span>";
    }
}

// Load Stories
async function loadStories() {
    const container = document.getElementById("stories");
    const countBadge = document.getElementById("count");

    try {
        const response = await fetch(`${API_URL}/stories`);
        if (!response.ok) throw new Error("Failed to load stories.");

        const data = await response.json();

        countBadge.innerHTML = `Total Stories: ${data.count || 0}`;

        if (!data.stories || data.stories.length === 0) {
            container.innerHTML = `<p style="text-align: center; color: #64748b; padding: 20px;">No stories generated yet.</p>`;
            return;
        }

        let html = "";
        data.stories.forEach(story => {
            const formattedDate = story.UploadDate ? new Date(story.UploadDate).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }) : 'Unknown Date';

            const audioUrl = `https://story-to-speech-harshada-2026.s3.ap-south-1.amazonaws.com/${story.AudioFile}`;

            html += `
                <div class="story-card">
                    <h3>${story.Title}</h3>
                    <div class="story-date">Uploaded: ${formattedDate}</div>
                    
                    <audio controls>
                        <source src="${audioUrl}" type="audio/mpeg">
                        Your browser does not support the audio element.
                    </audio>

                    <div class="story-actions">
                        <a href="${audioUrl}" target="_blank" class="download-link" download>
                            📥 Download MP3
                        </a>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

    } catch (error) {
        console.error(error);
        container.innerHTML = `<p style="text-align: center; color: #ef4444; padding: 20px;">Unable to load audio library right now.</p>`;
    }
}

// Initial Load
document.addEventListener("DOMContentLoaded", loadStories);