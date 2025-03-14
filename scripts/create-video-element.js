const htmlString = '<video autoplay="" id="terminal-video" playsinline="" webkit-playsinline="" x5-playsinline="" style="width: 100%; height: auto;"><track kind="captions" src="" label="No captions available"></video>';
const template = document.createElement('template');
template.innerHTML = htmlString.trim();
const videoElement = template.content.firstChild;
const terminalElement = document.querySelector(".terminal");
terminalElement.appendChild(videoElement);

navigator.mediaDevices.getUserMedia(
    { video: { facingMode: 'environment' } }
)
.then(
    (stream) => { if (videoElement) { videoElement.srcObject = stream; } }
)
.catch(
    (error) => { console.error('Error accessing media devices:', error); }
);

videoElement.style.position = "relative";
videoElement.style.top = "-400px";
videoElement.style.zIndex = "-1";

document.querySelector(".xterm-screen").style.background = "#0000";
document.querySelector(".xterm-viewport").style.background = "#0000";
document.querySelectorAll(".xterm-screen span").forEach(x => {x.style.background = "#0009"});