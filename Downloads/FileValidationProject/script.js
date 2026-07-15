const API_URL = "https://vowxg67b3l.execute-api.ap-south-1.amazonaws.com/prod/upload";

async function uploadFile() {

    const file = document.getElementById("fileInput").files[0];

    if (!file) {
        alert("Please select a file.");
        return;
    }

    const reader = new FileReader();

    reader.onload = async function () {

        const base64File = reader.result.split(",")[1];

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                filename: file.name,
                file: base64File
            })

        });

        const data = await response.json();

        console.log("API Response:", data);

        document.getElementById("result").innerHTML =
        "<pre>" + JSON.stringify(data, null, 2) + "</pre>";

    };

    reader.readAsDataURL(file);

}