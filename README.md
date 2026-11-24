# JIA — Video Quality Studio (starter)

A responsive, installable PWA starter for Android and desktop.

## Run it
- Upload the contents of this folder to a GitHub repository.
- Enable GitHub Pages in the repository settings (Deploy from a branch, `main`, `/root`).
- Open the published HTTPS link on your Android phone.
- In Chrome, use the browser menu → **Install app** or **Add to Home screen**.

For local testing, serve this folder with any static web server. Service workers require HTTPS or localhost.

## What works in this starter
- Welcome intro and replay button
- Responsive holographic teal UI
- Local video file selection and browser preview
- Reads video dimensions, duration, file type, and file size
- Keeps the original file unchanged and offers an original-file download
- SYSTEM announcements using the device/browser text-to-speech voice where supported
- PWA manifest and service worker

## Important limitations
- This starter does **not** transcode or compress video yet. It does not claim to improve visual quality.
- Standard browser video metadata does not reliably expose encoded FPS or a true visual-quality score. The displayed readiness number is a simple, transparent metadata-based indicator, not a quality measurement.
- Social platforms may re-encode uploaded videos.
- Anime artwork and character-specific voices are not included. Use only assets and voices that you have permission to publish.

## Next development steps
1. Add a real video-processing pipeline (e.g. FFmpeg/WASM) with explicit user-selected export settings.
2. Measure output metadata and compare actual input/output file sizes.
3. Add a genuine quality assessment method and explain its limits.
4. Add licensed character artwork and authorized voice recordings.
