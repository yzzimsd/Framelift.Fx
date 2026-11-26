const input = document.getElementById('videoInput');
const dropzone = document.getElementById('dropzone');
const emptyState = document.getElementById('emptyState');
const report = document.getElementById('report');
const preview = document.getElementById('preview');
const message = document.getElementById('systemMessage');
let currentUrl = null;

function say(text) {
  message.textContent = `“${text}”`;
  if (document.getElementById('voiceMode').value === 'off' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.96;
  utterance.pitch = 1.03;
  window.speechSynthesis.speak(utterance);
}
function sizeLabel(bytes) {
  if (!Number.isFinite(bytes)) return '—';
  const units = ['B','KB','MB','GB']; let n = bytes, i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}
function durationLabel(seconds) {
  if (!Number.isFinite(seconds)) return '—';
  const s = Math.floor(seconds), h = Math.floor(s/3600), m = Math.floor((s%3600)/60), r = s%60;
  return h ? `${h}:${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}` : `${m}:${String(r).padStart(2,'0')}`;
}
function analyze(file) {
  if (!file || !file.type.startsWith('video/')) { say('Please choose a supported video file.'); return; }
  if (currentUrl) URL.revokeObjectURL(currentUrl);
  currentUrl = URL.createObjectURL(file);
  preview.src = currentUrl;
  emptyState.classList.add('hidden'); report.classList.remove('hidden');
  document.getElementById('fileName').textContent = file.name;
  document.getElementById('fileType').textContent = file.type || 'Video file';
  document.getElementById('fileSize').textContent = sizeLabel(file.size);
  document.getElementById('resolution').textContent = 'Reading…';
  document.getElementById('fps').textContent = 'Not detected';
  document.getElementById('duration').textContent = 'Reading…';
  const keep = document.getElementById('downloadOriginal');
  keep.href = currentUrl; keep.download = file.name; keep.classList.remove('hidden');
  preview.onloadedmetadata = () => {
    const w = preview.videoWidth, h = preview.videoHeight;
    document.getElementById('resolution').textContent = w && h ? `${w} × ${h}` : 'Unavailable';
    document.getElementById('duration').textContent = durationLabel(preview.duration);
    // The browser's standard video element does not expose a reliable encoded FPS value.
    document.getElementById('fps').textContent = 'Not exposed';
    // A transparent technical readiness indicator based only on readable metadata.
    let score = 50;
    if (w >= 1280 && h >= 720) score += 20;
    if (w >= 1920 && h >= 1080) score += 10;
    if (file.size > 0 && preview.duration > 0) score += 10;
    if (file.type.includes('mp4')) score += 5;
    score = Math.min(score, 95);
    document.getElementById('score').textContent = score;
    document.getElementById('scoreBar').style.width = `${score}%`;
    say(`Analysis complete. Your video is ${w} by ${h} pixels. The original file is preserved.`);
  };
  preview.onerror = () => say('The browser could not read this video format.');
}
input.addEventListener('change', e => analyze(e.target.files[0]));
['dragenter','dragover'].forEach(type => dropzone.addEventListener(type, e => { e.preventDefault(); dropzone.classList.add('drag'); }));
['dragleave','drop'].forEach(type => dropzone.addEventListener(type, e => { e.preventDefault(); dropzone.classList.remove('drag'); }));
dropzone.addEventListener('drop', e => analyze(e.dataTransfer.files[0]));
document.getElementById('keepOriginal').addEventListener('click', () => {
  say('Your original video is unchanged. Use the download link to save a copy.');
  document.getElementById('downloadOriginal').click();
});
document.getElementById('testVoice').addEventListener('click', () => say('SYSTEM voice check. Framelift.fx is ready.'));
document.getElementById('voiceMode').addEventListener('change', e => {
  if (e.target.value === 'off' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  say(e.target.value === 'off' ? 'Voice announcements are off.' : 'SYSTEM voice announcements are on.');
});
function closeIntro() { document.getElementById('introOverlay').classList.add('done'); say('Initializing Framelift.fx system. Welcome. Your video workspace is ready.'); }
document.getElementById('enterApp').addEventListener('click', closeIntro);
document.getElementById('replayIntro').addEventListener('click', () => {
  document.getElementById('introOverlay').classList.remove('done');
});
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
}

// FRAME LIFT FX - PREMIUM ENHANCEMENT SYSTEM

const enhancementButton = document.getElementById("applyEnhancements");
const enhancementMessage = document.getElementById("enhancementMessage");

const enhancementControls = {
  sharpen: document.getElementById("enhanceSharpen"),
  denoise: document.getElementById("enhanceDenoise"),
  color: document.getElementById("enhanceColor"),
  smooth: document.getElementById("enhanceSmooth"),
  strength: document.getElementById("enhanceStrength")
};

function updateEnhancementPreview() {
  if (!preview || !preview.src || !preview.videoWidth) {
    enhancementMessage.textContent = "Please upload a video first.";
    return false;
  }

  const selected = [];
  const filters = [];

  const strength = enhancementControls.strength.value;

  const amount =
    strength === "light" ? 1 :
    strength === "strong" ? 3 : 2;

  if (enhancementControls.sharpen.checked) {
    selected.push("Sharpen");
    filters.push(`contrast(${1 + amount * 0.07})`);
  }

  if (enhancementControls.denoise.checked) {
    selected.push("Denoise Preview");
    filters.push(`brightness(${1 + amount * 0.015})`);
  }

  if (enhancementControls.color.checked) {
    selected.push("Color Enhancement");
    filters.push(`saturate(${1 + amount * 0.20})`);
  }

  if (enhancementControls.smooth.checked) {
    selected.push("Smooth Motion Preview");
    filters.push(
      `blur(${strength === "strong" ? "0.3px" : "0.1px"})`
    );
  }

  if (selected.length === 0) {
    preview.style.filter = "none";
    enhancementMessage.textContent =
      "Select at least one enhancement.";
    return false;
  }

  preview.style.filter = filters.join(" ");

  enhancementMessage.textContent =
    "Enhancement preview applied: " +
    selected.join(", ") +
    " (" + strength + " strength).";

  return true;
}

// PREMIUM LOADING SCREEN

async function showEnhancementLoader(processFunction) {
  const loader = document.getElementById("enhanceLoader");
  const percent = document.getElementById("loaderPercent");
  const bar = document.getElementById("loaderBar");
  const status = document.getElementById("loaderStatus");
  const ring = document.querySelector(".loader-ring");

  if (!loader || !percent || !bar || !status || !ring) {
    throw new Error("Loading screen elements are missing.");
  }

  function updateProgress(value, message) {
    const progress = Math.max(0, Math.min(100, value));

    percent.textContent = `${progress}%`;
    bar.style.width = `${progress}%`;

    ring.style.background =
      `conic-gradient(#78f0d8 ${progress * 3.6}deg,
      rgba(120,240,216,.1) 0deg)`;

    status.textContent = message;
  }

  loader.classList.remove("hidden");

  try {
    await new Promise(requestAnimationFrame);

    return await processFunction(updateProgress);

  } finally {
    loader.classList.add("hidden");
  }
}


            // ==========================================
// FRAME LIFT FX — SHARED PHOTO + VIDEO EXPORT
// REPLACE OLD EXPORT/PROCESSING CODE WITH THIS
// ==========================================

let processedVideoBlob = null;
let processedPhotoBlob = null;
let latestProcessedFile = null;
let exportObjectURL = null;
let selectedMediaType = null;
let selectedPhoto = null;
let selectedPhotoURL = null;

// Existing controls
const enhancementButton = document.getElementById("applyEnhancements");
const enhancementMessage = document.getElementById("enhancementMessage");

const enhancementControls = {
  sharpen: document.getElementById("enhanceSharpen"),
  denoise: document.getElementById("enhanceDenoise"),
  color: document.getElementById("enhanceColor"),
  smooth: document.getElementById("enhanceSmooth"),
  strength: document.getElementById("enhanceStrength")
};

// Photo controls (if your existing HTML has them)
const photoInput = document.getElementById("photoInput");
const photoEnhanceButton = document.getElementById("enhancePhoto");
const photoOriginal = document.getElementById("photoOriginal");
const photoWorkspace = document.getElementById("photoWorkspace");
const photoMessage = document.getElementById("photoMessage");
const photoScale = document.getElementById("photoScale");

// ==========================================
// CREATE ONE SHARED EXPORT PANEL
// ==========================================

const exportPanel = document.createElement("section");
exportPanel.id = "unifiedExportPanel";
exportPanel.innerHTML = `
  <div class="fx-export-header">
    <h2>Export & Output</h2>
    <p>Your enhanced photo or video appears here.</p>
  </div>

  <div class="fx-export-preview">
    <video id="fxOutputVideo" controls playsinline hidden></video>
    <img id="fxOutputPhoto" alt="Enhanced output" hidden>
    <div id="fxOutputEmpty">
      <div class="fx-export-icon">✦</div>
      <p>Your processed media will appear here</p>
    </div>
  </div>

  <div class="fx-export-actions">
    <a id="fxDownload" class="primary-btn" href="#" download hidden>
      Download
    </a>
    <button id="fxShare" class="primary-btn" type="button" disabled>
      Share
    </button>
  </div>

  <p id="fxExportMessage">Ready for processing.</p>
`;

const exportStyles = document.createElement("style");
exportStyles.textContent = `
  #unifiedExportPanel {
    width:100%;
    box-sizing:border-box;
    margin:0 0 24px;
    padding:20px;
    border:1px solid rgba(120,240,216,.20);
    border-radius:18px;
    background:rgba(12,42,48,.78);
    color:#e9fffb;
  }

  #unifiedExportPanel h2 {
    margin:0 0 8px;
    color:#78f0d8;
  }

  #unifiedExportPanel p {
    color:#91b8b5;
  }

  .fx-export-preview {
    width:100%;
    min-height:180px;
    margin:16px 0;
    background:#06191e;
    border-radius:14px;
    overflow:hidden;
    display:flex;
    align-items:center;
    justify-content:center;
  }

  .fx-export-preview video,
  .fx-export-preview img {
    max-width:100%;
    max-height:450px;
    width:100%;
    object-fit:contain;
  }

  #fxOutputEmpty {
    text-align:center;
    padding:35px 15px;
  }

  .fx-export-icon {
    font-size:38px;
    color:#78f0d8;
  }

  .fx-export-actions {
    display:flex;
    gap:10px;
    flex-wrap:wrap;
  }

  .fx-export-actions button,
  .fx-export-actions a {
    flex:1;
    min-width:120px;
    text-align:center;
    justify-content:center;
  }

  #fxShare:disabled {
    opacity:.45;
    cursor:not-allowed;
  }

  #fxExportMessage {
    font-size:13px;
    margin-top:12px;
  }
`;

document.head.appendChild(exportStyles);

// Place export panel near the top of the app
const mainContainer =
  document.querySelector("main") ||
  document.querySelector(".main-content") ||
  document.querySelector(".container") ||
  dropzone?.parentElement;

if (mainContainer) {
  mainContainer.insertBefore(exportPanel, mainContainer.firstChild);
} else {
  document.body.insertBefore(exportPanel, document.body.firstChild);
}

const fxOutputVideo = document.getElementById("fxOutputVideo");
const fxOutputPhoto = document.getElementById("fxOutputPhoto");
const fxOutputEmpty = document.getElementById("fxOutputEmpty");
const fxDownload = document.getElementById("fxDownload");
const fxShare = document.getElementById("fxShare");
const fxExportMessage = document.getElementById("fxExportMessage");

function fxMessage(text) {
  fxExportMessage.textContent = text;

  if (enhancementMessage) {
    enhancementMessage.textContent = text;
  }

  if (photoMessage) {
    photoMessage.textContent = text;
  }
}

function fxShowOutput(type, url) {
  fxOutputEmpty.hidden = true;
  fxOutputVideo.hidden = true;
  fxOutputPhoto.hidden = true;

  if (type === "video") {
    fxOutputVideo.src = url;
    fxOutputVideo.hidden = false;
  } else {
    fxOutputPhoto.src = url;
    fxOutputPhoto.hidden = false;
  }

  fxDownload.hidden = false;
  fxShare.disabled = false;
}

function fxSaveOutput(blob, filename, type) {
  if (exportObjectURL) {
    URL.revokeObjectURL(exportObjectURL);
  }

  exportObjectURL = URL.createObjectURL(blob);

  latestProcessedFile = new File(
    [blob],
    filename,
    { type: blob.type }
  );

  fxDownload.href = exportObjectURL;
  fxDownload.download = filename;
  fxDownload.textContent = "Download";

  fxShowOutput(type, exportObjectURL);
}

// ==========================================
// SHARED ENHANCEMENT SETTINGS
// ==========================================

function fxStrengthAmount() {
  const value = enhancementControls.strength?.value || "medium";

  return value === "light" ? 1 :
         value === "strong" ? 3 : 2;
}

function getExportFilters() {
  const amount = fxStrengthAmount();
  const filters = [];

  if (enhancementControls.sharpen?.checked) {
    filters.push(`contrast(${1 + amount * 0.07})`);
  }

  if (enhancementControls.denoise?.checked) {
    filters.push(`brightness(${1 + amount * 0.015})`);
  }

  if (enhancementControls.color?.checked) {
    filters.push(`saturate(${1 + amount * 0.20})`);
  }

  if (enhancementControls.smooth?.checked) {
    filters.push(`blur(${amount * 0.1}px)`);
  }

  return filters.length ? filters.join(" ") : "none";
}

function fxHasEnhancements() {
  return Object.values(enhancementControls).some(control => {
    return control && control.type === "checkbox" && control.checked;
  });
}

// ==========================================
// PROCESS PHOTO
// ==========================================

async function fxProcessPhoto() {
  if (!selectedPhoto) {
    fxMessage("Please upload a photo first.");
    return;
  }

  if (!fxHasEnhancements()) {
    fxMessage("Select at least one enhancement first.");
    return;
  }

  const amount = fxStrengthAmount();
  const scale = Math.max(
    1,
    Math.min(4, Number(photoScale?.value) || 1)
  );

  const canvas = document.createElement("canvas");

  canvas.width = Math.round(selectedPhoto.naturalWidth * scale);
  canvas.height = Math.round(selectedPhoto.naturalHeight * scale);

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    fxMessage("Canvas is not supported.");
    return;
  }

  const filters = [];

  if (enhancementControls.sharpen?.checked) {
    filters.push(`contrast(${1 + amount * 0.07})`);
  }

  if (enhancementControls.color?.checked) {
    filters.push(`saturate(${1 + amount * 0.20})`);
  }

  ctx.filter = filters.length ? filters.join(" ") : "none";

  ctx.drawImage(
    selectedPhoto,
    0,
    0,
    canvas.width,
    canvas.height
  );

  ctx.filter = "none";

  // Lightweight browser-based denoise approximation
  if (enhancementControls.denoise?.checked) {
    const tempCanvas = document.createElement("canvas");

    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    const tempCtx = tempCanvas.getContext("2d");

    tempCtx.filter = `blur(${amount * 0.12}px)`;
    tempCtx.drawImage(canvas, 0, 0);
    tempCtx.filter = "none";

    ctx.globalAlpha = 0.10 * amount;
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.globalAlpha = 1;
  }

  canvas.toBlob(blob => {
    if (!blob) {
      fxMessage("Could not create processed photo.");
      return;
    }

    processedPhotoBlob = blob;

    fxSaveOutput(
      blob,
      "framelift-enhanced-photo.jpg",
      "photo"
    );

    fxMessage("Photo processing complete. Download or share your photo.");
    say("Photo processing complete. Your enhanced photo is ready.");
  }, "image/jpeg", 0.95);
}

// ==========================================
// VIDEO EXPORT
// ==========================================

function fxRecorderMime() {
  if (!window.MediaRecorder) return "";

  const options = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm"
  ];

  return options.find(type => MediaRecorder.isTypeSupported(type)) || "";
}

async function fxProcessVideo() {
  if (!preview || !preview.videoWidth || !currentUrl) {
    fxMessage("Please upload a video first.");
    return;
  }

  if (!fxHasEnhancements()) {
    fxMessage("Select at least one enhancement first.");
    return;
  }

  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
    fxMessage("Video export is unsupported in this browser. Try Chrome.");
    return;
  }

  const mime = fxRecorderMime();

  if (!mime) {
    fxMessage("No supported video export format found.");
    return;
  }

  enhancementButton.disabled = true;

  const canvas = document.createElement("canvas");
  canvas.width = preview.videoWidth;
  canvas.height = preview.videoHeight;

  const ctx = canvas.getContext("2d");
  const stream = canvas.captureStream(30);

  let recorder;
  let chunks = [];
  let sourceStream = null;
  const oldTime = preview.currentTime;

  try {
    const capture = preview.captureStream || preview.mozCaptureStream;

    if (capture) {
      try {
        sourceStream = capture.call(preview);

        sourceStream.getAudioTracks().forEach(track => {
          stream.addTrack(track);
        });
      } catch (error) {
        console.warn("Audio capture unavailable.", error);
      }
    }

    recorder = new MediaRecorder(stream, { mimeType: mime });

    recorder.ondataavailable = event => {
      if (event.data?.size) chunks.push(event.data);
    };

    const done = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = reject;
    });

    const loader = document.getElementById("enhanceLoader");
    const percent = document.getElementById("loaderPercent");
    const bar = document.getElementById("loaderBar");
    const status = document.getElementById("loaderStatus");
    const ring = document.querySelector(".loader-ring");

    const showLoader = !!(loader && percent && bar && status && ring);

    if (showLoader) loader.classList.remove("hidden");

    const progress = (value, text) => {
      if (!showLoader) return;

      percent.textContent = `${Math.floor(value)}%`;
      bar.style.width = `${value}%`;
      status.textContent = text;

      ring.style.background =
        `conic-gradient(#78f0d8 ${value * 3.6}deg,
        rgba(120,240,216,.1) 0deg)`;
    };

    preview.pause();
    preview.currentTime = 0;

    await new Promise(resolve => {
      if (preview.readyState >= 2) resolve();
      else preview.addEventListener("loadeddata", resolve, { once: true });
    });

    recorder.start(1000);

    await preview.play();

    await new Promise((resolve, reject) => {
      let animation;

      function drawFrame() {
        try {
          ctx.filter = getExportFilters();
          ctx.drawImage(preview, 0, 0, canvas.width, canvas.height);
          ctx.filter = "none";
        } catch (error) {
          cancelAnimationFrame(animation);
          reject(error);
          return;
        }

        const progressValue = preview.duration
          ? Math.min(99, (preview.currentTime / preview.duration) * 100)
          : 0;

        progress(progressValue, `Processing video ${Math.floor(progressValue)}%`);

        if (preview.ended || preview.currentTime >= preview.duration) {
          if (recorder.state !== "inactive") recorder.stop();
          resolve();
          return;
        }

        animation = requestAnimationFrame(drawFrame);
      }

      animation = requestAnimationFrame(drawFrame);
    });

    await done;

    processedVideoBlob = new Blob(chunks, { type: mime });

    if (!processedVideoBlob.size) {
      throw new Error("Empty video export.");
    }

    const ext = mime.includes("mp4") ? "mp4" : "webm";

    fxSaveOutput(
      processedVideoBlob,
      `framelift-enhanced-video.${ext}`,
      "video"
    );

    progress(100, "Processing complete!");

    fxMessage("Video processing complete. Download or share your video.");
    say("Video processing complete. Your enhanced video is ready.");

    if (showLoader) {
      setTimeout(() => loader.classList.add("hidden"), 700);
    }

  } catch (error) {
    console.error("Video processing error:", error);
    fxMessage("Video processing failed. Try a shorter video.");

  } finally {
    preview.pause();

    try {
      preview.currentTime = oldTime;
    } catch {}

    stream.getTracks().forEach(track => track.stop());

    if (sourceStream) {
      sourceStream.getTracks().forEach(track => track.stop());
    }

    const loader = document.getElementById("enhanceLoader");
    if (loader) loader.classList.add("hidden");

    if (enhancementButton) enhancementButton.disabled = false;
  }
}

// ==========================================
// AUTO DETECT PHOTO OR VIDEO
// ==========================================

async function fxApplyEnhancements() {
  if (selectedMediaType === "photo") {
    await fxProcessPhoto();
  } else if (selectedMediaType === "video") {
    await fxProcessVideo();
  } else {
    fxMessage("Upload a photo or video first.");
  }
}

if (enhancementButton) {
  enhancementButton.onclick = fxApplyEnhancements;
}

if (photoEnhanceButton) {
  photoEnhanceButton.onclick = fxApplyEnhancements;
}

// ==========================================
// PHOTO UPLOAD
// ==========================================

if (photoInput) {
  photoInput.addEventListener("change", event => {
    const file = event.target.files?.[0];

    if (!file || !file.type.startsWith("image/")) {
      fxMessage("Please choose a valid photo.");
      return;
    }

    selectedMediaType = "photo";

    if (selectedPhotoURL) {
      URL.revokeObjectURL(selectedPhotoURL);
    }

    selectedPhotoURL = URL.createObjectURL(file);

    const image = new Image();

    image.onload = () => {
      selectedPhoto = image;

      if (photoOriginal) {
        photoOriginal.src = selectedPhotoURL;
      }

      if (photoWorkspace) {
        photoWorkspace.hidden = false;
        photoWorkspace.classList.remove("hidden");
      }

      fxMessage("Photo loaded. Adjust enhancements below and apply.");
    };

    image.onerror = () => {
      fxMessage("Unable to load this photo.");
    };

    image.src = selectedPhotoURL;
  });
}

// ==========================================
// VIDEO SELECTION
// ==========================================

if (input) {
  input.addEventListener("change", event => {
    if (event.target.files?.[0]) {
      selectedMediaType = "video";
      fxMessage("Video selected. Adjust enhancements below and apply.");
    }
  });
}

// Drag-and-drop video also selects video mode
if (dropzone) {
  dropzone.addEventListener("drop", event => {
    if (event.dataTransfer?.files?.[0]) {
      selectedMediaType = "video";
    }
  });
}

// ==========================================
// SHARE — ANDROID SHARE MENU
// ==========================================

fxShare.addEventListener("click", async () => {
  if (!latestProcessedFile) {
    fxMessage("Process a photo or video first.");
    return;
  }

  try {
    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [latestProcessedFile] })
    ) {
      await navigator.share({
        files: [latestProcessedFile],
        title: "Framelift.fx",
        text: "Processed with Framelift.fx"
      });
    } else {
      fxMessage("Sharing is unavailable. Download your file instead.");
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error(error);
      fxMessage("Unable to share the file.");
    }
  }
});

// ==========================================
// PREVIEW FILTER — PREVIEW ONLY
// ==========================================

function updateEnhancementPreview() {
  if (selectedMediaType === "photo" && selectedPhoto) {
    fxMessage("Photo selected. Apply Enhancements to export your photo.");
    return true;
  }

  if (!preview?.videoWidth) {
    fxMessage("Upload a photo or video first.");
    return false;
  }

  preview.style.filter = getExportFilters();

  fxMessage("Preview filters updated. Apply Enhancements to export.");
  return true;
}

console.log("Framelift.fx shared photo/video export system ready.");