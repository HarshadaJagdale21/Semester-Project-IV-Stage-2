// Replace with your API Gateway Invoke URL
const API_URL = "https://2mx42rztqa.execute-api.ap-south-1.amazonaws.com/prod";

// Upload Story
async function uploadStory() {

    const title = document.getElementById("title").value;
    const story = document.getElementById("story").value;

    if (title === "" || story === "") {
        alert("Please enter title and story");
        return;
    }

    const response = await fetch(API_URL + "/upload", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title: title,
            story: story
        })
    });

    const result = await response.json();

    alert(result.message);

    document.getElementById("title").value = "";
    document.getElementById("story").value = "";

    loadStories();
}

// Load Stories
async function loadStories() {

    const response = await fetch(API_URL + "/stories");

    const data = await response.json();

    document.getElementById("count").innerHTML =
        "Total Stories : " + data.count;

    let html = "";

    data.stories.forEach(story => {

        html += `
        <div class="story">
            <h3>${story.Title}</h3>

            <p><b>Uploaded:</b> ${story.UploadDate}</p>

            <audio controls>
                <source src="https://story-to-speech-harshada-2026.s3.ap-south-1.amazonaws.com/${story.AudioFile}" type="audio/mpeg">
            </audio>

            <br><br>

            <a href="https://story-to-speech-harshada-2026.s3.ap-south-1.amazonaws.com/${story.AudioFile}" target="_blank">
                Download MP3
            </a>

        </div>
        `;
    });

    document.getElementById("stories").innerHTML = html;
}

loadStories();