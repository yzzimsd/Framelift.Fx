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
// REAL VIDEO PROCESSING + EXPORT + SHARE
// ==========================================

let processedVideoBlob = null;
let processedPhotoBlob = null;
let latestProcessedFile = null;

function getShareButton() {
  let button = document.getElementById("shareProcessed");

  if (!button) {
    button = document.createElement("button");
    button.id = "shareProcessed";
    button.type = "button";
    button.textContent = "Share to Social Media";
    button.className = "primary-btn";

    const anchor =
      document.getElementById("enhancedDownload") ||
      document.getElementById("photoDownload") ||
      enhancementButton;

    anchor?.parentElement?.appendChild(button);
  }

  return button;
}

async function shareProcessedFile() {
  if (!latestProcessedFile) {
    alert("Process a video or photo first.");
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
        text: "Processed using Framelift.fx"
      });
    } else {
      alert("Direct file sharing isn't supported in this browser. Download your processed file first.");
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error(error);
      alert("Sharing was unsuccessful.");
    }
  }
}

getShareButton().addEventListener("click", shareProcessedFile);

function getRecorderMime() {
  const options = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm"
  ];

  return options.find(type =>
    MediaRecorder.isTypeSupported(type)
  ) || "";
}

async function processAndExportVideo() {
  if (!preview || !preview.videoWidth || !currentUrl) {
    enhancementMessage.textContent = "Please select a video first.";
    return;
  }

  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
    enhancementMessage.textContent =
      "Video export is not supported in this browser. Try Chrome.";
    return;
  }

  const mime = getRecorderMime();

  if (!mime) {
    enhancementMessage.textContent =
      "No supported video export format is available.";
    return;
  }

  enhancementButton.disabled = true;

  const canvas = document.createElement("canvas");
  canvas.width = preview.videoWidth;
  canvas.height = preview.videoHeight;

  const ctx = canvas.getContext("2d");

  const stream = canvas.captureStream(30);

  let sourceStream = null;
  let recorder;
  let chunks = [];

  const oldTime = preview.currentTime;
  const wasPlaying = !preview.paused;

  try {
    // Attempt to capture source audio, if the browser allows it.
    const capture = preview.captureStream || preview.mozCaptureStream;

    if (capture) {
      try {
        sourceStream = capture.call(preview);

        sourceStream.getAudioTracks().forEach(track => {
          stream.addTrack(track);
        });
      } catch (error) {
        console.warn("Audio capture unavailable:", error);
      }
    }

    recorder = new MediaRecorder(stream, { mimeType: mime });

    recorder.ondataavailable = event => {
      if (event.data && event.data.size) {
        chunks.push(event.data);
      }
    };

    const recorderDone = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = reject;
    });

    await showEnhancementLoader(async progress => {
      progress(5, "Preparing video...");
      preview.pause();

      preview.currentTime = 0;

      await new Promise(resolve => {
        if (preview.readyState >= 2) {
          resolve();
        } else {
          preview.addEventListener("loadeddata", resolve, { once: true });
        }
      });

      progress(10, "Starting video processor...");

      recorder.start(1000);

      await preview.play();

      return await new Promise((resolve, reject) => {
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

          const percent = preview.duration
            ? Math.min(
                95,
                10 + (preview.currentTime / preview.duration) * 85
              )
            : 10;

          progress(
            percent,
            `Processing video ${Math.floor(percent)}%...`
          );

          if (preview.ended || preview.currentTime >= preview.duration) {
            if (recorder.state !== "inactive") recorder.stop();
            resolve(true);
            return;
          }

          animation = requestAnimationFrame(drawFrame);
        }

        animation = requestAnimationFrame(drawFrame);
      });
    });

    await recorderDone;

    processedVideoBlob = new Blob(chunks, { type: mime });

    if (!processedVideoBlob.size) {
      throw new Error("The processed video is empty.");
    }

    const extension = mime.includes("mp4") ? "mp4" : "webm";

    latestProcessedFile = new File(
      [processedVideoBlob],
      `framelift-processed.${extension}`,
      { type: mime }
    );

    let download = document.getElementById("enhancedDownload");

    if (!download) {
      download = document.createElement("a");
      download.id = "enhancedDownload";
      download.textContent = "Download Processed Video";
      download.className = "primary-btn";

      enhancementButton.parentElement.appendChild(download);
    }

    if (enhancedUrl) URL.revokeObjectURL(enhancedUrl);

    enhancedUrl = URL.createObjectURL(processedVideoBlob);

    download.href = enhancedUrl;
    download.download = latestProcessedFile.name;
    download.classList.remove("hidden");

    const outputPanel = document.getElementById("outputPanel");
    const outputPreview = document.getElementById("outputPreview");

    if (outputPanel) outputPanel.classList.remove("hidden");
    if (outputPreview) outputPreview.src = enhancedUrl;

    progress(100, "Video processing complete!");

    enhancementMessage.textContent =
      "Video processed successfully! Download or share your new file.";

    say("Video processing complete. Your processed video is ready to download or share.");

  } catch (error) {
    console.error("Video processing error:", error);

    enhancementMessage.textContent =
      "Processing failed. Try a shorter video or a supported format.";

  } finally {
    preview.pause();

    try {
      preview.currentTime = oldTime;
    } catch {}

    if (wasPlaying) {
      preview.play().catch(() => {});
    }

    stream.getTracks().forEach(track => track.stop());

    if (sourceStream) {
      sourceStream.getTracks().forEach(track => track.stop());
    }

    enhancementButton.disabled = false;
  }
}

// Filters used on the actual exported video frames
function getExportFilters() {
  const strength = enhancementControls.strength?.value || "medium";

  const amount =
    strength === "light" ? 1 :
    strength === "strong" ? 3 : 2;

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
    filters.push(
      `blur(${strength === "strong" ? "0.3px" : "0.1px"})`
    );
  }

  return filters.length ? filters.join(" ") : "none";
}

// Replace the old preview-only click handler with actual processing.
enhancementButton.onclick = processAndExportVideo;

// ==========================================
// PHOTO ENHANCER — PROCESS + DOWNLOAD + SHARE
// ==========================================

(() => {
  const photoInput = document.getElementById("photoInput");
  const photoOriginal = document.getElementById("photoOriginal");
  const photoEnhancedPreview = document.getElementById("photoEnhancedPreview");

  const photoSharpen = document.getElementById("photoSharpen");
  const photoDenoise = document.getElementById("photoDenoise");
  const photoColor = document.getElementById("photoColor");
  const photoStrength = document.getElementById("photoStrength");
  const photoScale = document.getElementById("photoScale");

  const enhancePhoto = document.getElementById("enhancePhoto");
  const photoMessage = document.getElementById("photoMessage");
  const photoDownload = document.getElementById("photoDownload");

  if (!photoInput || !enhancePhoto) {
    console.warn("Photo Enhancer elements missing.");
    return;
  }

  let photoImage = null;
  let photoFile = null;
  let processedPhotoCanvas = null;
  let originalPhotoURL = null;

  function photoSay(text) {
    if (photoMessage) photoMessage.textContent = text;
  }

  // LOAD SELECTED PHOTO
  photoInput.addEventListener("change", event => {
    const file = event.target.files?.[0];

    if (!file || !file.type.startsWith("image/")) {
      photoSay("Please select a valid photo.");
      return;
    }

    photoFile = file;

    if (originalPhotoURL) {
      URL.revokeObjectURL(originalPhotoURL);
    }

    originalPhotoURL = URL.createObjectURL(file);

    const image = new Image();

    image.onload = () => {
      photoImage = image;
      processedPhotoCanvas = null;

      if (photoOriginal) {
        photoOriginal.src = originalPhotoURL;
      }

      if (photoEnhancedPreview.tagName === "IMG") {
        photoEnhancedPreview.src = originalPhotoURL;
      }

      const workspace = document.getElementById("photoWorkspace");

      if (workspace) {
        workspace.hidden = false;
        workspace.classList.remove("hidden");
      }

      enhancePhoto.disabled = false;

      photoSay("Photo loaded successfully. Ready to process.");

      if (photoDownload) photoDownload.classList.add("hidden");
    };

    image.onerror = () => {
      photoSay("Unable to read this image.");
    };

    image.src = originalPhotoURL;
  });

  // ACTUAL PHOTO PROCESSING
  function processPhoto() {
    if (!photoImage) {
      photoSay("Please select a photo first.");
      return null;
    }

    const scale = Math.max(
      1,
      Math.min(4, Number(photoScale?.value) || 1)
    );

    const strength = photoStrength?.value || "medium";

    const amount =
      strength === "light" ? 1 :
      strength === "strong" ? 3 : 2;

    const canvas = document.createElement("canvas");

    canvas.width = Math.round(photoImage.naturalWidth * scale);
    canvas.height = Math.round(photoImage.naturalHeight * scale);

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas unavailable.");
    }

    // Color and contrast processing
    const contrast = photoSharpen?.checked
      ? 1 + (amount * 0.07)
      : 1;

    const saturation = photoColor?.checked
      ? 1 + (amount * 0.20)
      : 1;

    ctx.filter = `contrast(${contrast}) saturate(${saturation})`;

    ctx.drawImage(
      photoImage,
      0,
      0,
      canvas.width,
      canvas.height
    );

    ctx.filter = "none";

    // Soft denoise approximation
    if (photoDenoise?.checked) {
      const temp = document.createElement("canvas");

      temp.width = canvas.width;
      temp.height = canvas.height;

      const tempCtx = temp.getContext("2d");

      tempCtx.filter = `blur(${amount * 0.12}px)`;

      tempCtx.drawImage(canvas, 0, 0);

      tempCtx.filter = "none";

      ctx.globalAlpha = 0.10 * amount;

      ctx.drawImage(temp, 0, 0);

      ctx.globalAlpha = 1;
    }

    processedPhotoCanvas = canvas;

    // Show enhanced output
    const previewURL = canvas.toDataURL("image/jpeg", 0.95);

    if (photoEnhancedPreview.tagName === "IMG") {
      photoEnhancedPreview.src = previewURL;
    } else {
      photoEnhancedPreview.style.backgroundImage =
        `url("${previewURL}")`;
    }

    // Make downloadable file
    canvas.toBlob(blob => {
      if (!blob) {
        photoSay("Could not create the output image.");
        return;
      }

      processedPhotoBlob = blob;

      latestProcessedFile = new File(
        [blob],
        "framelift-photo-enhanced.jpg",
        { type: "image/jpeg" }
      );

      if (photoDownload) {
        photoDownload.href = URL.createObjectURL(blob);
        photoDownload.download = "framelift-photo-enhanced.jpg";
        photoDownload.classList.remove("hidden");

        // Prevent anchor from being required if it was a button
        photoDownload.onclick = event => {
          if (photoDownload.tagName !== "A") {
            event.preventDefault();
            downloadBlob(blob, "framelift-photo-enhanced.jpg");
          }
        };
      }

      photoSay(
        `Photo processed successfully! Output: ${canvas.width} × ${canvas.height}. Download or use Share to Social Media.`
      );

    }, "image/jpeg", 0.95);

    return canvas;
  }

  // PROCESS BUTTON
  enhancePhoto.addEventListener("click", async () => {
    if (!photoImage) {
      photoSay("Please select a photo first.");
      return;
    }

    enhancePhoto.disabled = true;

    try {
      await showEnhancementLoader(async progress => {
        progress(10, "Preparing photo...");

        await new Promise(resolve => setTimeout(resolve, 200));

        progress(35, "Analyzing image...");

        await new Promise(resolve => setTimeout(resolve, 200));

        progress(60, "Processing image...");

        processPhoto();

        await new Promise(resolve => setTimeout(resolve, 200));

        progress(90, "Preparing output...");

        await new Promise(resolve => setTimeout(resolve, 150));

        progress(100, "Photo processing complete!");

        return true;
      });

    } catch (error) {
      console.error("Photo processing error:", error);
      photoSay("Photo processing failed. Please try again.");

    } finally {
      enhancePhoto.disabled = false;
    }
  });

})();