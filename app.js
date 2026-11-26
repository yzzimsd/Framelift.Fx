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

// APPLY ENHANCEMENT

enhancementButton.addEventListener("click", async () => {
  if (!preview || !preview.videoWidth) {
    enhancementMessage.textContent =
      "Please upload a video first.";
    return;
  }

  enhancementButton.disabled = true;

  try {
    await showEnhancementLoader(async (progress) => {

      progress(10, "Preparing video preview...");

      await new Promise(resolve => setTimeout(resolve, 300));

      progress(35, "Analyzing video details...");

      await new Promise(resolve => setTimeout(resolve, 300));

      progress(60, "Applying visual adjustments...");

      const success = updateEnhancementPreview();

      await new Promise(resolve => setTimeout(resolve, 300));

      if (!success) return false;

      progress(85, "Finalizing preview...");

      await new Promise(resolve => setTimeout(resolve, 300));

      progress(100, "Enhancement preview complete!");

      return true;
    });

  } catch (error) {
    console.error("Enhancement error:", error);
    enhancementMessage.textContent =
      "Enhancement failed. Please try again.";

  } finally {
    enhancementButton.disabled = false;
  }
});


// ==========================================
// PHOTO ENHANCER + MY COLLECTION
// ==========================================

const photoInput = document.getElementById("photoInput");
const photoDropzone = document.getElementById("photoDropzone");
const photoWorkspace = document.getElementById("photoWorkspace");
const photoOriginal = document.getElementById("photoOriginal");
const photoEnhancedPreview = document.getElementById("photoEnhancedPreview");
const photoMessage = document.getElementById("photoMessage");
const enhancePhotoButton = document.getElementById("enhancePhoto");
const photoDownload = document.getElementById("photoDownload");

const galleryGrid = document.getElementById("galleryGrid");
const galleryEmpty = document.getElementById("galleryEmpty");
const galleryCount = document.getElementById("galleryCount");

let selectedPhoto = null;
let photoPreviewUrl = null;
let photoExportUrl = null;
let enhancedPhotoBlob = null;
let photoDatabase = null;

const galleryObjectUrls = new Map();

// ==========================================
// OPEN PHOTO DATABASE
// ==========================================

function openPhotoDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("FrameliftPhotoCollection", 1);

    request.onupgradeneeded = event => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains("photos")) {
        db.createObjectStore("photos", {
          keyPath: "id",
          autoIncrement: true
        });
      }
    };

    request.onsuccess = () => {
      photoDatabase = request.result;
      resolve(photoDatabase);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// ==========================================
// SAVE PHOTO TO COLLECTION
// ==========================================

function savePhotoToCollection(blob, name) {
  return new Promise((resolve, reject) => {
    if (!photoDatabase) {
      reject(new Error("Photo database is unavailable."));
      return;
    }

    const transaction = photoDatabase.transaction(
      ["photos"],
      "readwrite"
    );

    const store = transaction.objectStore("photos");

    store.add({
      name: name,
      image: blob,
      date: new Date().toISOString()
    });

    transaction.oncomplete = () => resolve(true);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

// ==========================================
// LOAD GALLERY
// ==========================================

function loadPhotoGallery() {
  if (!photoDatabase) return;

  const transaction = photoDatabase.transaction(
    ["photos"],
    "readonly"
  );

  const store = transaction.objectStore("photos");
  const request = store.getAll();

  request.onsuccess = () => {
    renderPhotoGallery(request.result);
  };

  request.onerror = () => {
    console.error("Could not load photo gallery.");
  };
}

// ==========================================
// DISPLAY GALLERY ITEMS
// ==========================================

function renderPhotoGallery(photos) {
  galleryObjectUrls.forEach(url => URL.revokeObjectURL(url));
  galleryObjectUrls.clear();

  galleryGrid.innerHTML = "";

  const total = photos.length;

  galleryCount.textContent =
    `${total} saved ${total === 1 ? "item" : "items"}`;

  galleryEmpty.classList.toggle("hidden", total !== 0);

  photos.slice().reverse().forEach(photo => {
    const card = document.createElement("div");
    card.className = "gallery-card";

    const image = document.createElement("img");
    const imageUrl = URL.createObjectURL(photo.image);

    galleryObjectUrls.set(photo.id, imageUrl);

    image.src = imageUrl;
    image.alt = photo.name;
    image.loading = "lazy";

    const details = document.createElement("div");
    details.className = "gallery-card-details";

    const title = document.createElement("strong");
    title.textContent = photo.name;

    const date = document.createElement("small");
    date.textContent = new Date(photo.date).toLocaleDateString();

    const actions = document.createElement("div");
    actions.className = "gallery-card-actions";

    const downloadButton = document.createElement("button");
    downloadButton.className = "primary";
    downloadButton.textContent = "Download";

    downloadButton.addEventListener("click", () => {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = photo.name;
      link.click();
    });

    const deleteButton = document.createElement("button");
    deleteButton.className = "secondary";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", async () => {
      const confirmed = window.confirm(
        "Delete this picture from My Collection?"
      );

      if (!confirmed) return;

      await deletePhotoFromCollection(photo.id);
    });

    details.append(title, date);
    actions.append(downloadButton, deleteButton);
    card.append(image, details, actions);

    galleryGrid.appendChild(card);
  });
}

// ==========================================
// DELETE GALLERY ITEM
// ==========================================

function deletePhotoFromCollection(id) {
  return new Promise((resolve, reject) => {
    const transaction = photoDatabase.transaction(
      ["photos"],
      "readwrite"
    );

    transaction.objectStore("photos").delete(id);

    transaction.oncomplete = () => {
      loadPhotoGallery();
      resolve(true);
    };

    transaction.onerror = () => reject(transaction.error);
  });
}

// ==========================================
// SELECT PHOTO
// ==========================================

function selectPhoto(file) {
  if (!file || !file.type.startsWith("image/")) {
    photoMessage.textContent = "Please choose a supported image.";
    return;
  }

  selectedPhoto = file;
enhancedPhotoBlob = null;

  if (photoPreviewUrl) {
    URL.revokeObjectURL(photoPreviewUrl);
  }

  photoPreviewUrl = URL.createObjectURL(file);

  photoOriginal.src = photoPreviewUrl;
  photoEnhancedPreview.src = photoPreviewUrl;

  photoWorkspace.classList.remove("hidden");

  if (photoExportUrl) {
    URL.revokeObjectURL(photoExportUrl);
    photoExportUrl = null;
  }

  photoDownload.classList.add("hidden");

  photoMessage.textContent =
    "Photo loaded. Choose your enhancements and tap Enhance Photo.";
}

// ==========================================
// PHOTO INPUT
// ==========================================

photoInput.addEventListener("change", event => {
  selectPhoto(event.target.files[0]);
});

["dragenter", "dragover"].forEach(type => {
  photoDropzone.addEventListener(type, event => {
    event.preventDefault();
    photoDropzone.classList.add("drag");
  });
});

["dragleave", "drop"].forEach(type => {
  photoDropzone.addEventListener(type, event => {
    event.preventDefault();
    photoDropzone.classList.remove("drag");
  });
});

photoDropzone.addEventListener("drop", event => {
  selectPhoto(event.dataTransfer.files[0]);
});

// ==========================================
// ENHANCE PHOTO
// ==========================================

enhancePhotoButton.addEventListener("click", async () => {
  if (!selectedPhoto) {
    photoMessage.textContent = "Please choose a photo first.";
    return;
  }

  enhancePhotoButton.disabled = true;

  photoMessage.textContent = "Processing your photo...";

  try {
    const image = new Image();

    const imageUrl = URL.createObjectURL(selectedPhoto);

    try {
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = imageUrl;
      });

      const scale = Number(
        document.getElementById("photoScale").value
      );

      const strength =
        document.getElementById("photoStrength").value;

      const amount =
        strength === "light" ? 1 :
        strength === "strong" ? 3 : 2;

      const sharpen =
        document.getElementById("photoSharpen").checked;

      const denoise =
        document.getElementById("photoDenoise").checked;

      const color =
        document.getElementById("photoColor").checked;

      const canvas = document.createElement("canvas");

      canvas.width = Math.round(image.naturalWidth * scale);
      canvas.height = Math.round(image.naturalHeight * scale);

      const context = canvas.getContext("2d");

      const filters = [];

      if (sharpen) {
        filters.push(`contrast(${1 + amount * 0.08})`);
      }

      if (denoise) {
        filters.push(
          `blur(${amount === 3 ? "0.5px" : "0.25px"})`
        );
      }

      if (color) {
        filters.push(`saturate(${1 + amount * 0.15})`);
      }

      context.filter = filters.length
        ? filters.join(" ")
        : "none";

      context.drawImage(
        image,
        0,
        0,
        canvas.width,
        canvas.height
      );

      context.filter = "none";

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(result => {
          if (result) resolve(result);
          else reject(new Error("Image export failed."));
        }, "image/png");
      });

      if (photoExportUrl) {
        URL.revokeObjectURL(photoExportUrl);
      }

      enhancedPhotoBlob = blob;

photoExportUrl = URL.createObjectURL(blob);

photoEnhancedPreview.src = photoExportUrl;

photoDownload.classList.add("hidden");

photoMessage.textContent =
  "Enhancement complete! Tap Export Photo to save your picture.";

say("Photo enhancement complete. Your preview is ready for export.");

    } finally {
      URL.revokeObjectURL(imageUrl);
    }

  } catch (error) {
    console.error("Photo enhancement error:", error);

    photoMessage.textContent =
      "Photo processing failed. Please try another image.";

  } finally {
    enhancePhotoButton.disabled = false;
  }
});

// ==========================================
// GALLERY REFRESH
// ==========================================

document.getElementById("refreshGallery").addEventListener(
  "click",
  loadPhotoGallery
);

// ==========================================
// INITIALIZE PHOTO DATABASE
// ==========================================

openPhotoDatabase()
  .then(() => {
    loadPhotoGallery();
    console.log("Framelift.fx Photo Collection is ready.");
  })
  .catch(error => {
    console.error("Photo database error:", error);

    photoMessage.textContent =
      "Gallery storage is unavailable in this browser.";
  });


// ==========================================
// INDEPENDENT PHOTO EXPORT BUTTON
// ==========================================

const exportPhotoButton = document.getElementById("exportPhoto");

exportPhotoButton.addEventListener("click", async () => {
  if (!selectedPhoto) {
    photoMessage.textContent = "Please choose a photo first.";
    return;
  }

  if (!photoDatabase) {
    photoMessage.textContent = "Gallery is still initializing. Try again.";
    return;
  }

  exportPhotoButton.disabled = true;

  try {
    const isEnhanced = !!enhancedPhotoBlob;

    const exportBlob = isEnhanced
      ? enhancedPhotoBlob
      : selectedPhoto;

    const baseName = selectedPhoto.name.replace(/\.[^.]+$/, "");

    const exportName = isEnhanced
      ? `${baseName}-enhanced.png`
      : selectedPhoto.name;

    // Save to My Collection
    await savePhotoToCollection(exportBlob, exportName);

    // Update gallery
    loadPhotoGallery();

    // Download to device
    const downloadUrl = URL.createObjectURL(exportBlob);

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = exportName;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(downloadUrl), 10000);

    photoMessage.textContent = isEnhanced
      ? "Enhanced photo exported and saved to My Collection!"
      : "Original photo exported and saved to My Collection!";

    say("Photo successfully exported and saved to your collection.");

  } catch (error) {
    console.error("Photo export error:", error);
    photoMessage.textContent = "Export failed. Please try again.";

  } finally {
    exportPhotoButton.disabled = false;
  }
});
