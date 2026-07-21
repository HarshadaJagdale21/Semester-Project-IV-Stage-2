const startBtn = document.getElementById("startBtn");
const voiceText = document.getElementById("voiceText");

const SpeechRecognition =
window.SpeechRecognition ||
window.webkitSpeechRecognition;

const recognition = new SpeechRecognition();

recognition.lang = "en-IN";

startBtn.onclick = () =>{

recognition.start();

};

recognition.onresult = function(event){

let text = event.results[0][0].transcript;

voiceText.value = text;

};