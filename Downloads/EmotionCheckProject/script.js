const uploadAPI='https://1un5t6ql1i.execute-api.ap-south-1.amazonaws.com/upload';
const emotionAPI='https://1un5t6ql1i.execute-api.ap-south-1.amazonaws.com/emotion';
const happiestAPI='https://1un5t6ql1i.execute-api.ap-south-1.amazonaws.com/happiest';
const video=document.getElementById('video');
const canvas=document.getElementById('canvas');
let img='';
navigator.mediaDevices.getUserMedia({video:true}).then(s=>video.srcObject=s).catch(e=>alert(e));
function capture(){canvas.width=video.videoWidth;canvas.height=video.videoHeight;canvas.getContext('2d').drawImage(video,0,0);img=canvas.toDataURL('image/jpeg').split(',')[1];alert('Captured');}
async function upload(){let n=document.getElementById('personName').value;if(!img)return alert('Capture first');let r=await fetch(uploadAPI,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({personName:n,image:img})});alert(await r.text());}
async function loadData(){let r=await fetch(emotionAPI);let d=await r.json();let t=document.getElementById('tableBody');t.innerHTML='';d.forEach(i=>t.innerHTML+=`<tr><td>${i.PersonName}</td><td>${i.Emotion}</td><td>${i.Confidence}</td></tr>`);}
async function loadHappiest(){let r=await fetch(happiestAPI);let p=await r.json();document.getElementById('happiest').innerHTML=`<h3>${p.PersonName}</h3><p>${p.Emotion}</p><p>${p.Confidence}</p>`;}
