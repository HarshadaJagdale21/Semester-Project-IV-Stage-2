const uploadAPI='https://1un5t6ql1i.execute-api.ap-south-1.amazonaws.com/upload';
const emotionAPI='https://1un5t6ql1i.execute-api.ap-south-1.amazonaws.com/emotion';
const happiestAPI='https://1un5t6ql1i.execute-api.ap-south-1.amazonaws.com/happiest';
const video=document.getElementById('video');
const canvas=document.getElementById('canvas');
let img='';
navigator.mediaDevices.getUserMedia({video:true}).then(s=>video.srcObject=s).catch(e=>alert(e));
function capture(){canvas.width=video.videoWidth;canvas.height=video.videoHeight;canvas.getContext('2d').drawImage(video,0,0);img=canvas.toDataURL('image/jpeg').split(',')[1];alert('Captured');}
async function upload(){let n=document.getElementById('personName').value;if(!img)return alert('Capture first');let r=await fetch(uploadAPI,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({personName:n,image:img})});alert(await r.text());}
async function loadData(){leconst uploadAPI = 'https://1un5t6ql1i.execute-api.ap-south-1.amazonaws.com/upload';
const emotionAPI = 'https://1un5t6ql1i.execute-api.ap-south-1.amazonaws.com/emotion';
const happiestAPI = 'https://1un5t6ql1i.execute-api.ap-south-1.amazonaws.com/happiest';

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const overlay = document.querySelector('.video-overlay');
let img = '';

// Start Camera Stream
navigator.mediaDevices.getUserMedia({ video: true })
    .then(s => {
        video.srcObject = s;
        overlay.textContent = "Live Stream Active";
        overlay.style.backgroundColor = "rgba(16, 185, 129, 0.85)"; // active green
    })
    .catch(e => {
        console.error(e);
        overlay.textContent = "Camera Blocked";
        overlay.style.backgroundColor = "#ef4444"; // red
    });

// Capture Canvas Snap
function capture() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    img = canvas.toDataURL('image/jpeg').split(',')[1];
    
    // Quick visual flash and confirmation style on capture overlay
    overlay.textContent = "Frame Captured!";
    overlay.style.backgroundColor = "#3b82f6"; // blue
    setTimeout(() => {
        overlay.textContent = "Live Stream Active";
        overlay.style.backgroundColor = "rgba(16, 185, 129, 0.85)";
    }, 1500);
}

// Upload Captured image
async function upload() {
    let n = document.getElementById('personName').value;
    if (!img) return alert('Please capture a photo first.');
    if (!n.trim()) return alert('Please input a Subject Name.');

    try {
        let r = await fetch(uploadAPI, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ personName: n, image: img })
        });
        let resultMessage = await r.text();
        alert(`Analysis Upload Status: ${resultMessage}`);
    } catch (e) {
        alert("Upload Failed. Check console.");
        console.error(e);
    }
}

// Fetch and render historical table data
async function loadData() {
    try {
        let r = await fetch(emotionAPI);
        let d = await r.json();
        let t = document.getElementById('tableBody');
        t.innerHTML = '';
        
        if (d.length === 0) {
            t.innerHTML = `<tr><td colspan="3" class="muted-text text-center">No history records found.</td></tr>`;
            return;
        }

        d.forEach(i => {
            t.innerHTML += `
                <tr>
                    <td><strong>${i.PersonName}</strong></td>
                    <td><span class="badge">${i.Emotion}</span></td>
                    <td>${(parseFloat(i.Confidence) * 100).toFixed(1)}%</td>
                </tr>
            `;
        });
    } catch (e) {
        console.error("Failed to load records database", e);
    }
}

// Fetch and render single Happiest Record block
async function loadHappiest() {
    try {
        let r = await fetch(happiestAPI);
        let p = await r.json();
        const displayDiv = document.getElementById('happiest');
        
        // Structure the output visually clean inside the cards
        displayDiv.className = ""; // Remove placeholder styling
        displayDiv.innerHTML = `
            <div class="happiest-card-content">
                <div>
                    <div class="muted-text">Highest Score</div>
                    <div class="happiest-name">${p.PersonName}</div>
                </div>
                <div class="happiest-stats">
                    <span class="badge">${p.Emotion}</span>
                    <div class="muted-text" style="margin-top:0.25rem;">${(parseFloat(p.Confidence) * 100).toFixed(1)}% Match</div>
                </div>
            </div>
        `;
    } catch (e) {
        console.error("Failed to fetch happiest profiles", e);
    }
} r=await fetch(emotionAPI);let d=await r.json();let t=document.getElementById('tableBody');t.innerHTML='';d.forEach(i=>t.innerHTML+=`<tr><td>${i.PersonName}</td><td>${i.Emotion}</td><td>${i.Confidence}</td></tr>`);}
async function loadHappiest(){let r=await fetch(happiestAPI);let p=await r.json();document.getElementById('happiest').innerHTML=`<h3>${p.PersonName}</h3><p>${p.Emotion}</p><p>${p.Confidence}</p>`;}
