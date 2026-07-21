const startBtn = document.getElementById("startBtn");
const voiceText = document.getElementById("voiceText");
const statusText = document.getElementById("statusText");
const visualizer = document.getElementById("visualizer");
const results = document.getElementById("results");

const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";

    startBtn.onclick = () => {
        try {
            recognition.start();
            setListeningState(true);
        } catch (e) {
            recognition.stop();
            setListeningState(false);
        }
    };

    recognition.onresult = async function(event) {

        let text = event.results[0][0].transcript;

        voiceText.value = text;

        setListeningState(false);

        searchHouse(text);

    };

    recognition.onerror = function() {

        statusText.innerText = "Error recognizing voice. Try again.";

        setListeningState(false);

    };

    recognition.onend = function() {

        setListeningState(false);

    };

    function setListeningState(isListening) {

        if (isListening) {

            startBtn.classList.add("listening");
            visualizer.classList.add("active");
            statusText.innerText = "Listening to your request...";

        } else {

            startBtn.classList.remove("listening");
            visualizer.classList.remove("active");
            statusText.innerText = "Tap microphone to start searching";

        }

    }

} else {

    statusText.innerText = "Speech Recognition not supported on this browser.";

}

async function searchHouse(query) {

    statusText.innerText = "Searching houses...";

    try {

        const response = await fetch(
            "https://fc5yibuhuc.execute-api.ap-south-1.amazonaws.com/prod/search",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    query: query
                })
            }
        );

       const data = await response.json();

console.log("FULL API RESPONSE:", data);


let houses;


if (data.body) {

    houses = JSON.parse(data.body);

}
else {

    houses = data;

}


displayHouses(houses);

    } catch (error) {

        console.error(error);

        statusText.innerText = "Error connecting to AWS.";

    }

}

function displayHouses(houses) {

    results.innerHTML = "";

    if (houses.length === 0) {

        results.innerHTML = `
            <div class="empty-state">
                <h2>No House Found</h2>
                <p>Try another search.</p>
            </div>
        `;

        return;

    }

    houses.forEach(house => {

        results.innerHTML += `

        <div class="house-card">

            <img src="${house.ImageURL}" alt="${house.HouseName}" width="100%">

            <h2>${house.HouseName}</h2>

            <p><b>City:</b> ${house.City}</p>

            <p><b>Area:</b> ${house.Area}</p>

            <p><b>Price:</b> ₹${house.Price}</p>

            <p><b>BHK:</b> ${house.BHK}</p>

            <p><b>Lift:</b> ${house.Lift}</p>

            <p><b>Parking:</b> ${house.Parking}</p>

            <p><b>Hospital Nearby:</b> ${house.HospitalNearby}</p>

            <p><b>Bank Nearby:</b> ${house.BankNearby}</p>

            <p><b>School Nearby:</b> ${house.SchoolNearby}</p>

            <p><b>Park Nearby:</b> ${house.ParkNearby}</p>

            <p><b>Furnished:</b> ${house.Furnished}</p>

            <p><b>Contact:</b> ${house.ContactNumber}</p>

        </div>

        <br>

        `;

    });

}