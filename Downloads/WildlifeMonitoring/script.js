const API_URL = "https://zj82fy3f2l.execute-api.ap-south-1.amazonaws.com/prod";

// Upload Image
async function uploadImage() {

    const file = document.getElementById("imageInput").files[0];

    if (!file) {
        alert("Please select an image.");
        return;
    }

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

            document.getElementById("message").innerHTML = result.message;

            loadAnimals();

        } catch (error) {

            document.getElementById("message").innerHTML = "Upload Failed";

            console.log(error);

        }

    };

    reader.readAsDataURL(file);

}


// Load Dashboard
async function loadAnimals() {

    const response = await fetch(API_URL + "/animals");

    const animals = await response.json();

    const table = document.getElementById("animalTable");

    table.innerHTML = "";

    animals.forEach(animal => {

        table.innerHTML += `

        <tr>

        <td>${animal.AnimalName}</td>

        <td>${animal.DetectionCount}</td>

        <td>${animal.Confidence}%</td>

        <td>${animal.LastSeen}</td>

        <td>

        <img src="${animal.ImageURL}">

        </td>

        </tr>

        `;

    });

}

loadAnimals();