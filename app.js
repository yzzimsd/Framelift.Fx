const input = document.getElementById('videoInput');
const dropzone = document.getElementById('dropzone');
const emptyState = document.getElementById('emptyState');
const report = document.getElementById('report');
const preview = document.getElementById('preview');
const message = document.getElementById('systemMessage');

let currentUrl = null;
let currentFile = null;
let enhancedUrl = null;

function say(text) {
  message.textContent = `“${text}”`;

  if (
    document.getElementById('voiceMode').value === 'off' ||
    !('speechSynthesis' in window)
  ) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.96;
  utterance.pitch = 1.03;
  window.speechSynthesis.speak(utterance);
}

function sizeLabel(bytes) {
  if (!Number.isFinite(bytes)) return '—';

  const units = ['B', 'KB', 'MB', 'GB'];
  let n = bytes, i = 0;

  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }

  return `${n.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

function durationLabel(seconds) {
  if (!Number.isFinite(seconds)) return '—';

  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;

  return h
    ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
    : `${m}:${String(r).padStart(2, '0')}`;
}

// VIDEO ANALYSIS

function analyze(file) {
  if (!file || !file.type.startsWith('video/')) {
    say('Please choose a supported video file.');
    return;
  }

  currentFile = file;

  if (currentUrl) URL.revokeObjectURL(currentUrl);

  currentUrl = URL.createObjectURL(file);

  preview.src = currentUrl;
  preview.style.filter = 'none';

  emptyState.classList.add('hidden');
  report.classList.remove('hidden');

  document.getElementById('fileName').textContent = file.name;
  document.getElementById('fileType').textContent = file.type || 'Video file';
  document.getElementById('fileSize').textContent = sizeLabel(file.size);
  document.getElementById('resolution').textContent = 'Reading…';
  document.getElementById('fps').textContent = 'Not detected';
  document.getElementById('duration').textContent = 'Reading…';

  const keep = document.getElementById('downloadOriginal');

  keep.href = currentUrl;
  keep.download = file.name;
  keep.classList.remove('hidden');

  document.getElementById('frameExportMessage').textContent =
    'Ready to process frames. Choose settings and export.';

  document.getElementById('enhancedDownload').classList.add('hidden');
  document.getElementById('outputPanel').classList.add('hidden');

  preview.onloadedmetadata = () => {
    const w = preview.videoWidth;
    const h = preview.videoHeight;

    document.getElementById('resolution').textContent =
      w && h ? `${w} × ${h}` : 'Unavailable';

    document.getElementById('duration').textContent =
      durationLabel(preview.duration);

    document.getElementById('fps').textContent = 'Not exposed';

    let score = 50;

    if (w >= 1280 && h >= 720) score += 20;
    if (w >= 1920 && h >= 1080) score += 10;
    if (file.size > 0 && preview.duration > 0) score += 10;
    if (file.type.includes('mp4')) score += 5;

    score = Math.min(score, 95);

    document.getElementById('score').textContent = score;
    document.getElementById('scoreBar').style.width = `${score}%`;

    say(
      `Analysis complete. Your video is ${w} by ${h} pixels. The original file is preserved.`
    );
  };

  preview.onerror = () =>
    say('The browser could not read this video format.');
}

input.addEventListener('change', e => analyze(e.target.files[0]));

['dragenter', 'dragover'].forEach(type => {
  dropzone.addEventListener(type, e => {
    e.preventDefault();
    dropzone.classList.add('drag');
  });
});

['dragleave', 'drop'].forEach(type => {
  dropzone.addEventListener(type, e => {
    e.preventDefault();
    dropzone.classList.remove('drag');
  });
});

dropzone.addEventListener('drop', e =>
  analyze(e.dataTransfer.files[0])
);

// ORIGINAL VIDEO

document.getElementById('keepOriginal').addEventListener('click', () => {
  say('Your original video is unchanged. Use the download link to save a copy.');
  document.getElementById('downloadOriginal').click();
});

// VOICE

document.getElementById('testVoice').addEventListener('click', () =>
  say('SYSTEM voice check. Framelift.fx is ready.')
);

document.getElementById('voiceMode').addEventListener('change', e => {
  if (e.target.value === 'off' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  say(
    e.target.value === 'off'
      ? 'Voice announcements are off.'
      : 'SYSTEM voice announcements are on.'
  );
});

// INTRO

function closeIntro() {
  document.getElementById('introOverlay').classList.add('done');

  say(
    'Initializing Framelift.fx system. Welcome. Your video workspace is ready.'
  );
}

document.getElementById('enterApp').addEventListener('click', closeIntro);

document.getElementById('replayIntro').addEventListener('click', () =>
  document.getElementById('introOverlay').classList.remove('done')
);

// SERVICE WORKER

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}

// EXISTING PREVIEW ENHANCEMENT

const enhancementButton = document.getElementById('applyEnhancements');
const enhancementMessage = document.getElementById('enhancementMessage');

const enhancementControls = {
  sharpen: document.getElementById('enhanceSharpen'),
  denoise: document.getElementById('enhanceDenoise'),
  color: document.getElementById('enhanceColor'),
  smooth: document.getElementById('enhanceSmooth'),
  strength: document.getElementById('enhanceStrength')
};

function selectedFilterString(previewMode = false) {
  const strength = enhancementControls.strength.value;

  const amount =
    strength === 'light' ? 1 :
    strength === 'strong' ? 3 : 2;

  const filters = [];

  if (enhancementControls.sharpen.checked) {
    filters.push(`contrast(${1 + amount * 0.07})`);
  }

  if (enhancementControls.denoise.checked) {
    filters.push(
      `blur(${
        strength === 'strong'
          ? '0.45px'
          : strength === 'medium'
          ? '0.25px'
          : '0.1px'
      })`
    );
  }

  if (enhancementControls.color.checked) {
    filters.push(`saturate(${1 + amount * 0.20})`);
  }

  if (previewMode && enhancementControls.smooth.checked) {
    filters.push(
      `blur(${strength === 'strong' ? '0.3px' : '0.1px'})`
    );
  }

  return filters.length ? filters.join(' ') : 'none';
}

function updateEnhancementPreview() {
  if (!preview || !preview.src || !preview.videoWidth) {
    enhancementMessage.textContent = 'Please upload a video first.';
    return false;
  }

  const selected = [];

  if (enhancementControls.sharpen.checked)
    selected.push('Sharpen/contrast');

  if (enhancementControls.denoise.checked)
    selected.push('Light smoothing');

  if (enhancementControls.color.checked)
    selected.push('Color enhancement');

  if (enhancementControls.smooth.checked)
    selected.push('Smooth motion preview');

  if (!selected.length) {
    preview.style.filter = 'none';
    enhancementMessage.textContent = 'Select at least one enhancement.';
    return false;
  }

  preview.style.filter = selectedFilterString(true);

  enhancementMessage.textContent =
    `Preview applied: ${selected.join(', ')} (${enhancementControls.strength.value} strength).`;

  return true;
}

// LOADING SCREEN

async function showEnhancementLoader(processFunction) {
  const loader = document.getElementById('enhanceLoader');
  const percent = document.getElementById('loaderPercent');
  const bar = document.getElementById('loaderBar');
  const status = document.getElementById('loaderStatus');
  const ring = document.querySelector('.loader-ring');

  if (!loader || !percent || !bar || !status || !ring) {
    throw new Error('Loading screen elements are missing.');
  }

  function updateProgress(value, text) {
    const progress = Math.max(0, Math.min(100, value));

    percent.textContent = `${progress}%`;
    bar.style.width = `${progress}%`;

    ring.style.background =
      `conic-gradient(#78f0d8 ${progress * 3.6}deg,
      rgba(120,240,216,.1) 0deg)`;

    status.textContent = text;
  }

  loader.classList.remove('hidden');

  try {
    await new Promise(requestAnimationFrame);
    return await processFunction(updateProgress);
  } finally {
    loader.classList.add('hidden');
  }
}

// APPLY PREVIEW ENHANCEMENTS

enhancementButton.addEventListener('click', async () => {
  if (!preview || !preview.videoWidth) {
    enhancementMessage.textContent = 'Please upload a video first.';
    return;
  }

  enhancementButton.disabled = true;

  try {
    await showEnhancementLoader(async progress => {
      progress(15, 'Preparing preview…');

      await new Promise(r => setTimeout(r, 180));

      progress(55, 'Applying selected visual adjustments…');

      const ok = updateEnhancementPreview();

      await new Promise(r => setTimeout(r, 180));

      if (!ok) return false;

      progress(100, 'Preview complete!');

      return true;
    });
  } catch (err) {
    console.error(err);
    enhancementMessage.textContent = 'Preview failed. Please try again.';
  } finally {
    enhancementButton.disabled = false;
  }
});

// FRAME-BY-FRAME EXPORT

const exportButton = document.getElementById('exportFrames');
const frameMessage = document.getElementById('frameExportMessage');
const enhancedDownload = document.getElementById('enhancedDownload');
const outputPanel = document.getElementById('outputPanel');
const outputPreview = document.getElementById('outputPreview');

function bestRecorderType() {
  const types = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm'
  ];

  return types.find(t =>
    window.MediaRecorder && MediaRecorder.isTypeSupported(t)
  ) || '';
}

function waitEvent(target, eventName, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for ${eventName}`));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timer);
      target.removeEventListener(eventName, handler);
      target.removeEventListener('error', errorHandler);
    }

    function handler() {
      cleanup();
      resolve();
    }

    function errorHandler() {
      cleanup();
      reject(new Error('Video playback error'));
    }

    target.addEventListener(eventName, handler, { once: true });
    target.addEventListener('error', errorHandler, { once: true });
  });
}

exportButton.addEventListener('click', async () => {
  if (!currentFile || !preview.src || !preview.videoWidth) {
    frameMessage.textContent = 'Please upload and load a video first.';
    return;
  }

  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
    frameMessage.textContent =
      'This browser does not support canvas video recording. Try a current Chrome browser.';
    return;
  }

  const type = bestRecorderType();

  if (!type) {
    frameMessage.textContent =
      'No compatible video recording format was detected in this browser.';
    return;
  }

  exportButton.disabled = true;
  enhancedDownload.classList.add('hidden');
  frameMessage.textContent = 'Preparing frame processing…';

  const originalTime = preview.currentTime;
  const originalWasPlaying = !preview.paused;

  const canvas = document.createElement('canvas');
  canvas.width = preview.videoWidth;
  canvas.height = preview.videoHeight;

  const ctx = canvas.getContext('2d', { alpha: false });

  if (!ctx) {
    exportButton.disabled = false;
    frameMessage.textContent = 'Could not create frame-processing canvas.';
    return;
  }

  const canvasStream = canvas.captureStream(30);

  let audioStream = null;
  let combinedStream = canvasStream;
  let recorder = null;
  let chunks = [];

  try {
    const captureFn = preview.captureStream || preview.mozCaptureStream;

    if (captureFn) {
      try {
        audioStream = captureFn.call(preview);

        const audioTracks = audioStream.getAudioTracks();

        audioTracks.forEach(t => canvasStream.addTrack(t));
      } catch (e) {
        console.warn('Audio capture unavailable', e);
      }
    }

    recorder = new MediaRecorder(combinedStream, {
      mimeType: type
    });

    recorder.ondataavailable = e => {
      if (e.data && e.data.size) chunks.push(e.data);
    };

    const finished = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = e =>
        reject(e.error || new Error('Recorder error'));
    });

    await showEnhancementLoader(async progress => {
      progress(2, 'Preparing output canvas…');

      preview.pause();
      preview.style.filter = 'none';

      if (preview.readyState < 2) {
        await waitEvent(preview, 'loadeddata');
      }

      if (preview.currentTime !== 0) {
        const seekDone = waitEvent(preview, 'seeked').catch(() => {});
        preview.currentTime = 0;
        await seekDone;
      }

      const fps = 30;

      recorder.start(1000);

      progress(5, 'Processing video frames…');

      await preview.play();

      let lastProgress = -1;

      return await new Promise((resolve, reject) => {
        let rafId;

        const draw = () => {
          if (
            preview.ended ||
            preview.currentTime >= preview.duration - 0.02
          ) {
            try {
              ctx.drawImage(
                preview,
                0,
                0,
                canvas.width,
                canvas.height
              );
            } catch {}

            recorder.stop();
            resolve(true);
            return;
          }

          try {
            ctx.filter = selectedFilterString(false);

            ctx.drawImage(
              preview,
              0,
              0,
              canvas.width,
              canvas.height
            );

            ctx.filter = 'none';
          } catch (err) {
            recorder.stop();
            reject(err);
            return;
          }

          const pct = Math.min(
            95,
            5 + (preview.currentTime / preview.duration) * 90
          );

          const p = Math.floor(pct);

          if (p !== lastProgress) {
            lastProgress = p;

            progress(
              p,
              `Processing frame at ${preview.currentTime.toFixed(1)}s of ${preview.duration.toFixed(1)}s…`
            );
          }

          rafId = requestAnimationFrame(draw);
        };

        rafId = requestAnimationFrame(draw);

        preview.addEventListener('error', () => {
          cancelAnimationFrame(rafId);

          try {
            if (recorder.state !== 'inactive') recorder.stop();
          } catch {}

          reject(new Error('Video playback error during processing.'));
        }, { once: true });
      });
    });

    await finished;

    const blob = new Blob(chunks, { type });

    if (!blob.size) {
      throw new Error('Recorder produced an empty video file.');
    }

    if (enhancedUrl) URL.revokeObjectURL(enhancedUrl);

    enhancedUrl = URL.createObjectURL(blob);

    outputPreview.src = enhancedUrl;
    outputPanel.classList.remove('hidden');

    enhancedDownload.href = enhancedUrl;

    const ext = type.includes('mp4') ? 'mp4' : 'webm';

    enhancedDownload.download = `framelift-enhanced.${ext}`;

    enhancedDownload.textContent =
      `Download processed video (${sizeLabel(blob.size)})`;

    enhancedDownload.classList.remove('hidden');

    frameMessage.textContent =
      `Export complete. ${sizeLabel(blob.size)} output created. ` +
      `${audioStream && audioStream.getAudioTracks().length
        ? 'Audio track capture was attempted.'
        : 'Audio may not be included in this browser.'}`;

    say('Frame processing and video export are complete. Your original file remains unchanged.');

  } catch (err) {
    console.error('Frame export failed:', err);

    frameMessage.textContent =
      `Export failed: ${err.message || 'Browser processing error'}. Try a shorter or lower-resolution video.`;

  } finally {
    try {
      preview.pause();
      preview.currentTime = Math.min(
        originalTime,
        preview.duration || 0
      );
    } catch {}

    if (originalWasPlaying) {
      preview.play().catch(() => {});
    }

    try {
      canvasStream.getTracks().forEach(t => t.stop());
    } catch {}

    try {
      if (audioStream) {
        audioStream.getTracks().forEach(t => t.stop());
      }
    } catch {}

    exportButton.disabled = false;
  }
});

/* =========================================
   FRAMELIFT.FX — PHOTO TOOLS EXTENSION
   Photo Enhancer + AI Background Remover
========================================= */

(() => {
  const $ = id => document.getElementById(id);

  /* =====================================
     PHOTO ENHANCER
  ===================================== */

  const photoInput = $("photoInput");
  const photoOriginal = $("photoOriginal");
  const photoPreview = $("photoEnhancedPreview");
  const photoEnhanceBtn = $("enhancePhoto");
  const photoDownloadBtn = $("photoDownload");
  const photoMessage = $("photoMessage");

  let photoImg = null;
  let enhancedPhotoBlob = null;
  let enhancedPhotoCanvas = null;
  let photoObjectURL = null;

  function photoStatus(message) {
    if (photoMessage) photoMessage.textContent = message;
  }

  function loadPhoto(file) {
    if (!file || !file.type.startsWith("image/")) {
      photoStatus("Please select a valid image.");
      return;
    }

    if (photoObjectURL) URL.revokeObjectURL(photoObjectURL);

    photoObjectURL = URL.createObjectURL(file);
    photoImg = new Image();

    photoImg.onload = () => {
      photoOriginal.src = photoObjectURL;
      photoPreview.src = photoObjectURL;
      enhancedPhotoBlob = null;
      enhancedPhotoCanvas = null;

      const workspace = $("photoWorkspace");
      if (workspace) {
        workspace.hidden = false;
        workspace.style.display = "";
      }

      photoStatus("Photo loaded. Ready to enhance.");
    };

    photoImg.onerror = () => photoStatus("Unable to load photo.");
    photoImg.src = photoObjectURL;
  }

  if (photoInput) {
    photoInput.addEventListener("change", e => {
      loadPhoto(e.target.files?.[0]);
    });
  }

  /* Enhance photo */

  if (photoEnhanceBtn) {
    photoEnhanceBtn.addEventListener("click", async () => {
      if (!photoImg) {
        photoStatus("Upload a photo first.");
        return;
      }

      photoEnhanceBtn.disabled = true;
      photoStatus("Enhancing photo...");

      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const scale = $("photoScale")?.value === "2" ? 2 : 1;

        canvas.width = Math.min(photoImg.width * scale, 8192);
        canvas.height = Math.min(photoImg.height * scale, 8192);

        const sharp = Number($("photoSharpen")?.value || 0);
        const denoise = Number($("photoDenoise")?.value || 0);
        const color = Number($("photoColor")?.value || 100);

        const strength = $("photoStrength")?.value || "medium";

        const power =
          strength === "strong" ? 1.5 :
          strength === "light" ? 0.65 : 1;

        // Basic browser-based enhancement
        ctx.filter = `
          contrast(${100 + sharp * power}%)
          saturate(${color}%)
          brightness(102%)
        `;

        ctx.drawImage(photoImg, 0, 0, canvas.width, canvas.height);

        // Gentle smoothing
        if (denoise > 0) {
          const smooth = document.createElement("canvas");
          smooth.width = canvas.width;
          smooth.height = canvas.height;

          const sctx = smooth.getContext("2d");
          sctx.filter = `blur(${Math.min(denoise * power, 2)}px)`;
          sctx.drawImage(canvas, 0, 0);

          ctx.globalAlpha = 0.18;
          ctx.drawImage(smooth, 0, 0);
          ctx.globalAlpha = 1;
        }

        enhancedPhotoCanvas = canvas;

        enhancedPhotoBlob = await new Promise(resolve =>
          canvas.toBlob(resolve, "image/png")
        );

        photoPreview.src = canvas.toDataURL("image/png");
        photoStatus("Enhancement complete!");

      } catch (err) {
        console.error(err);
        photoStatus("Enhancement failed. Try another image.");
      } finally {
        photoEnhanceBtn.disabled = false;
      }
    });
  }

  /* Photo Download */

  if (photoDownloadBtn) {
    photoDownloadBtn.addEventListener("click", () => {
      if (!enhancedPhotoBlob) {
        photoStatus("Enhance the photo first.");
        return;
      }

      downloadBlob(
        enhancedPhotoBlob,
        "framelift-enhanced.png"
      );
    });
  }

  /* =====================================
     SHARED DOWNLOAD / SHARE HELPERS
  ===================================== */

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  async function shareBlob(blob, filename) {
    const file = new File([blob], filename, {
      type: blob.type || "image/png"
    });

    if (navigator.share && navigator.canShare) {
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Enhanced with Framelift.fx"
        });
        return true;
      }
    }

    downloadBlob(blob, filename);
    return false;
  }

  /* =====================================
     PHOTO SHARE BUTTON
     Creates a button automatically
  ===================================== */

  if (photoDownloadBtn && ! $("photoShare")) {
    const shareBtn = document.createElement("button");

    shareBtn.id = "photoShare";
    shareBtn.type = "button";
    shareBtn.textContent = "Share";
    shareBtn.className = photoDownloadBtn.className || "btn";

    photoDownloadBtn.insertAdjacentElement("afterend", shareBtn);

    shareBtn.addEventListener("click", async () => {
      if (!enhancedPhotoBlob) {
        photoStatus("Enhance your photo first.");
        return;
      }

      try {
        const shared = await shareBlob(
          enhancedPhotoBlob,
          "framelift-enhanced.png"
        );

        photoStatus(
          shared ? "Share menu opened!" : "Image downloaded. Sharing isn't supported here."
        );
      } catch (err) {
        if (err.name !== "AbortError") {
          photoStatus("Unable to share image.");
        }
      }
    });
  }

  /* =====================================
     BACKGROUND REMOVER SECTION
     Auto-created — no HTML changes
  ===================================== */

  const bgSection = document.createElement("section");
  bgSection.id = "backgroundRemoverSection";
  bgSection.className = "photo-studio";

  bgSection.innerHTML = `
    <div class="section-heading">
      <div>
        <span class="eyebrow">03 / AI TOOL</span>
        <h2>Background Remover</h2>
        <p>Remove backgrounds and create transparent PNG images.</p>
      </div>
    </div>

    <div class="bg-remover-card">
      <label class="bg-upload" for="bgRemoveInput">
        <span class="bg-upload-icon">✂️</span>
        <strong>Upload an image</strong>
        <span>Tap here to choose your photo</span>
      </label>

      <input
        type="file"
        id="bgRemoveInput"
        accept="image/*"
        hidden
      />

      <div id="bgRemoveWorkspace" hidden>
        <div class="bg-preview-grid">
          <div class="bg-preview-box">
            <h4>Original</h4>
            <img id="bgOriginalPreview" alt="Original image"/>
          </div>

          <div class="bg-preview-box">
            <h4>Transparent Result</h4>
            <div class="transparent-checker">
              <img id="bgResultPreview" alt="Background removed"/>
            </div>
          </div>
        </div>

        <button id="bgRemoveButton" class="bg-action" type="button">
          Remove Background
        </button>

        <button id="bgDownloadButton" class="bg-action" type="button" disabled>
          Download PNG
        </button>

        <button id="bgShareButton" class="bg-action" type="button" disabled>
          Share Image
        </button>

        <p id="bgRemoveMessage" role="status">
          Select an image to begin.
        </p>
      </div>
    </div>
  `;

  // Insert after the existing Photo Studio section
  const photoStudio = $("photoStudio");

  if (photoStudio) {
    photoStudio.insertAdjacentElement("afterend", bgSection);
  } else {
    const bottomGrid = document.querySelector(".bottom-grid");
    if (bottomGrid) {
      bottomGrid.insertAdjacentElement("beforebegin", bgSection);
    } else {
      document.body.appendChild(bgSection);
    }
  }

  /* Background remover styling */

  const bgStyles = document.createElement("style");

  bgStyles.textContent = `
    #backgroundRemoverSection {
      margin-top: 24px;
    }

    .bg-remover-card {
      padding: 20px;
      border: 1px solid rgba(114,237,220,.18);
      border-radius: 20px;
      background: rgba(12,42,48,.78);
    }

    .bg-upload {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 35px 15px;
      border: 1px dashed rgba(120,240,216,.5);
      border-radius: 16px;
      cursor: pointer;
      text-align: center;
    }

    .bg-upload-icon {
      font-size: 32px;
    }

    .bg-preview-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin: 20px 0;
    }

    .bg-preview-box {
      min-width: 0;
      text-align: center;
    }

    .bg-preview-box img {
      width: 100%;
      max-height: 350px;
      object-fit: contain;
      border-radius: 12px;
    }

    .transparent-checker {
      background-color: #fff;
      background-image:
        linear-gradient(45deg, #ddd 25%, transparent 25%),
        linear-gradient(-45deg, #ddd 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #ddd 75%),
        linear-gradient(-45deg, transparent 75%, #ddd 75%);
      background-size: 20px 20px;
      background-position: 0 0, 0 10px, 10px -10px, -10px 0;
      border-radius: 12px;
      overflow: hidden;
    }

    .bg-action {
      width: 100%;
      margin-top: 10px;
      padding: 13px;
      border: 1px solid rgba(120,240,216,.35);
      border-radius: 12px;
      background: rgba(66,207,201,.12);
      color: inherit;
      font: inherit;
      cursor: pointer;
    }

    .bg-action:disabled {
      opacity: .45;
      cursor: not-allowed;
    }

    #bgRemoveMessage {
      text-align: center;
      color: #91b8b5;
      margin-top: 14px;
    }

    @media(max-width:500px) {
      .bg-preview-grid {
        grid-template-columns: 1fr;
      }
    }
  `;

  document.head.appendChild(bgStyles);

  /* =====================================
     AI BACKGROUND REMOVAL ENGINE
  ===================================== */

  const bgInput = $("bgRemoveInput");
  const bgOriginal = $("bgOriginalPreview");
  const bgResult = $("bgResultPreview");
  const bgWorkspace = $("bgRemoveWorkspace");
  const bgButton = $("bgRemoveButton");
  const bgDownload = $("bgDownloadButton");
  const bgShare = $("bgShareButton");
  const bgMessage = $("bgRemoveMessage");

  let bgImageFile = null;
  let bgRemovedBlob = null;
  let bgObjectURL = null;

  function bgStatus(text) {
    if (bgMessage) bgMessage.textContent = text;
  }

  if (bgInput) {
    bgInput.addEventListener("change", e => {
      const file = e.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) {
        bgStatus("Please choose a valid image.");
        return;
      }

      bgImageFile = file;
      bgRemovedBlob = null;

      if (bgObjectURL) URL.revokeObjectURL(bgObjectURL);
      bgObjectURL = URL.createObjectURL(file);

      bgOriginal.src = bgObjectURL;
      bgResult.removeAttribute("src");

      bgWorkspace.hidden = false;
      bgDownload.disabled = true;
      bgShare.disabled = true;

      bgStatus("Image ready. Tap Remove Background.");
    });
  }

  if (bgButton) {
    bgButton.addEventListener("click", async () => {
      if (!bgImageFile) {
        bgStatus("Upload an image first.");
        return;
      }

      bgButton.disabled = true;
      bgDownload.disabled = true;
      bgShare.disabled = true;

      bgStatus("Loading AI model...");

      try {
        // Load AI background-removal library from CDN
        const bgModule = await import(
          "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.5/+esm"
        );

        bgStatus("AI is processing your image...");

        const removeBackground = bgModule.removeBackground;

        if (!removeBackground) {
          throw new Error("Background removal module unavailable.");
        }

        const resultBlob = await removeBackground(bgImageFile, {
          model: "medium",
          output: {
            format: "image/png",
            quality: 1
          }
        });

        bgRemovedBlob = resultBlob;

        const resultURL = URL.createObjectURL(resultBlob);
        bgResult.src = resultURL;

        bgDownload.disabled = false;
        bgShare.disabled = false;

        bgStatus("Background successfully removed!");

      } catch (error) {
        console.error("Background removal error:", error);

        bgStatus(
          "AI processing failed. Check your internet connection and try again."
        );

      } finally {
        bgButton.disabled = false;
      }
    });
  }

  /* Download transparent image */

  if (bgDownload) {
    bgDownload.addEventListener("click", () => {
      if (!bgRemovedBlob) return;

      downloadBlob(
        bgRemovedBlob,
        "framelift-background-removed.png"
      );
    });
  }

  /* Share transparent image */

  if (bgShare) {
    bgShare.addEventListener("click", async () => {
      if (!bgRemovedBlob) return;

      try {
        const shared = await shareBlob(
          bgRemovedBlob,
          "framelift-background-removed.png"
        );

        bgStatus(
          shared ? "Share menu opened!" : "Downloaded. Share menu unavailable."
        );

      } catch (error) {
        if (error.name !== "AbortError") {
          bgStatus("Unable to share image.");
        }
      }
    });
  }

  console.log("Framelift Photo Tools initialized.");

})();