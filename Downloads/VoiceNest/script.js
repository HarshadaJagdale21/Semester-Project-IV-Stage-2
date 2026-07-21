const startBtn = document.getElementById("startBtn");
const voiceText = document.getElementById("voiceText");
const statusText = document.getElementById("statusText");
const visualizer = document.getElementById("visualizer");

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
            // Catches error if recognition is already running
            recognition.stop();
            setListeningState(false);
        }
    };

    recognition.onresult = function(event) {
        let text = event.results[0][0].transcript;
        voiceText.value = text;
        setListeningState(false);
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