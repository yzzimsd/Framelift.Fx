const $ = (id) => document.getElementById(id);

const intro = $("introOverlay");
const enter = $("enterApp");
const replay = $("replayIntro");
const videoInput = $("videoInput");
const preview = $("preview");

let currentVideoURL = null;
let currentFile = null;

function enterJIA() {
  intro.classList.add("hidden");
  $("systemMessage").textContent =
    "SYSTEM: JIA is online. Select a video to begin.";
}

enter.addEventListener("click", enterJIA);

replay.addEventListener("click", () => {
  intro.classList.remove("hidden");
});

function formatSize(bytes) {
  if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + " KB";
  }
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

// Create the social sharing button
const shareButton = document.createElement("button");
shareButton.id = "shareVideo";
shareButton.className = "primary full";
shareButton.textContent = "↗ SHARE TO SOCIAL MEDIA";
shareButton.hidden = true;
$("report").appendChild(shareButton);

videoInput.addEventListener("change", () => {
  const file = videoInput.files[0];
  if (!file) return;

  currentFile = file;

  if (currentVideoURL) {
    URL.revokeObjectURL(currentVideoURL);
  }

  currentVideoURL = URL.createObjectURL(file);
  preview.src = currentVideoURL;

  $("emptyState").classList.add("hidden");
  $("report").classList.remove("hidden");

  $("fileName").textContent = file.name;
  $("fileType").textContent = file.type || "Unknown format";
  $("fileSize").textContent = formatSize(file.size);
  $("resolution").textContent = "Analyzing...";
  $("duration").textContent = "Analyzing...";
  $("fps").textContent = "Source FPS unavailable";

  $("downloadOriginal").href = currentVideoURL;
  $("downloadOriginal").download = file.name;
  $("downloadOriginal").classList.remove("hidden");

  shareButton.hidden = false;

  $("systemMessage").textContent =
    "SYSTEM: Video selected. Analyzing properties...";
});

preview.addEventListener("loadedmetadata", () => {
  $("resolution").textContent =
    `${preview.videoWidth} × ${preview.videoHeight}`;

  $("duration").textContent =
    formatDuration(preview.duration);

  $("fps").textContent =
    "Requires detailed media analysis";

  // This is a file-readiness check, not a visual quality score.
  const ready =
    preview.videoWidth > 0 &&
    preview.videoHeight > 0 &&
    Number.isFinite(preview.duration);

  const score = ready ? 100 : 0;

  $("score").textContent = score;
  $("scoreBar").style.width = score + "%";

  $("systemMessage").textContent =
    "SYSTEM: Video analysis complete. Original file preserved.";
});

$("keepOriginal").addEventListener("click", () => {
  $("systemMessage").textContent =
    "SYSTEM: Original video preserved. No conversion performed.";

  $("downloadOriginal").click();
});

// Android and browser social sharing
shareButton.addEventListener("click", async () => {
  if (!currentFile) return;

  try {
    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [currentFile] })
    ) {
      await navigator.share({
        title: "JIA Video",
        text: "Shared using JIA Video Quality Studio.",
        files: [currentFile]
      });

      $("systemMessage").textContent =
        "SYSTEM: Sharing menu opened successfully.";
    } else {
      $("downloadOriginal").click();

      $("systemMessage").textContent =
        "SYSTEM: Sharing unavailable. Download your video and share it manually.";
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      $("systemMessage").textContent =
        "SYSTEM: Sharing failed. Please download your original video.";
    }
  }
});

// SYSTEM voice
$("testVoice").addEventListener("click", () => {
  if ($("voiceMode").value === "off") return;

  if ("speechSynthesis" in window) {
    speechSynthesis.cancel();

    const message = new SpeechSynthesisUtterance(
      "Welcome to JIA. Your video quality workspace is ready."
    );

    speechSynthesis.speak(message);
  }
});

$("voiceMode").addEventListener("change", (event) => {
  if (
    event.target.value === "off" &&
    "speechSynthesis" in window
  ) {
    speechSynthesis.cancel();
  }
});
