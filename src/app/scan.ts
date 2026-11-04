// Camera scan: one face at a time inside a 3×3 guide, then hand off to the flat map to check.
// Nothing leaves the phone: frames are read in the page and never uploaded.

import { COLOR_NAME, type Face, STICKER_COLOR } from "../cube";
import { type RGB, classify } from "../scan/classify";
import { GUIDE, sampleFace } from "../scan/sample";
import { FACE_HINT, saveEntered } from "./solveMine";
import type { Screen } from "./shell";

const ORDER: Face[] = ["U", "F", "R", "B", "L", "D"];
const STATE_ORDER: Face[] = ["U", "R", "F", "D", "L", "B"];
const PREVIEW = 480; // square preview / sampling size in pixels

export function mountScan(root: HTMLElement): Screen {
  root.innerHTML = `
    <main class="scan">
      <h2>Scan your cube</h2>
      <p class="scan-step" aria-live="polite"></p>
      <div class="viewfinder">
        <canvas width="${PREVIEW}" height="${PREVIEW}" aria-label="Camera view with a 3 by 3 guide"></canvas>
        <video playsinline muted autoplay></video>
        <p class="cam-msg">Tap <strong>Start camera</strong>. Your camera stays on this phone — nothing is uploaded.</p>
      </div>
      <div class="captured" aria-label="Faces scanned so far"></div>
      <div class="actions three">
        <button id="redo" disabled>Retake</button>
        <button id="shoot" class="primary">Start camera</button>
        <a class="button" href="#/solve">Tap instead</a>
      </div>
      <ul class="scan-tips">
        <li>Fill the guide with one face, square on.</li>
        <li>Even light, no glare. Daylight works best.</li>
        <li>You'll check every color before solving.</li>
      </ul>
    </main>`;

  const canvas = root.querySelector("canvas")!;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const video = root.querySelector("video")!;
  const msg = root.querySelector<HTMLElement>(".cam-msg")!;
  const stepEl = root.querySelector<HTMLElement>(".scan-step")!;
  const shoot = root.querySelector<HTMLButtonElement>("#shoot")!;
  const redo = root.querySelector<HTMLButtonElement>("#redo")!;
  const captured = root.querySelector<HTMLElement>(".captured")!;

  const faces: RGB[][] = [];
  let stream: MediaStream | null = null;
  let frame = 0;

  const showStep = () => {
    const f = ORDER[faces.length];
    stepEl.innerHTML = f
      ? `Face ${faces.length + 1} of 6 — <strong>${FACE_HINT[f]}</strong>`
      : "All 6 faces scanned.";
    captured.innerHTML = faces
      .map(
        (cells, k) =>
          `<div class="mini" title="${COLOR_NAME[ORDER[k]]} center">${cells
            .map((c) => `<span style="background:rgb(${c.join(",")})"></span>`)
            .join("")}</div>`,
      )
      .join("");
    redo.disabled = faces.length === 0;
  };

  const drawFrame = () => {
    if (video.readyState < 2) return;
    const vw = video.videoWidth,
      vh = video.videoHeight,
      side = Math.min(vw, vh);
    ctx.drawImage(video, (vw - side) / 2, (vh - side) / 2, side, side, 0, 0, PREVIEW, PREVIEW);
    // The guide: the exact cells that get read.
    const x0 = PREVIEW * GUIDE.inset,
      cell = (PREVIEW * (1 - 2 * GUIDE.inset)) / 3;
    const f = ORDER[faces.length];
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    for (let k = 0; k <= 3; k++) {
      ctx.beginPath();
      ctx.moveTo(x0 + k * cell, x0);
      ctx.lineTo(x0 + k * cell, x0 + 3 * cell);
      ctx.moveTo(x0, x0 + k * cell);
      ctx.lineTo(x0 + 3 * cell, x0 + k * cell);
      ctx.stroke();
    }
    if (f) {
      // Ring the middle cell in the color its center should be.
      ctx.strokeStyle = STICKER_COLOR[f];
      ctx.lineWidth = 6;
      ctx.strokeRect(x0 + cell + 6, x0 + cell + 6, cell - 12, cell - 12);
    }
  };
  const draw = () => {
    frame = requestAnimationFrame(draw);
    drawFrame();
  };

  const start = async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
        audio: false,
      });
      video.srcObject = stream;
      await video.play();
      msg.hidden = true;
      shoot.textContent = "Capture";
      draw();
    } catch {
      msg.innerHTML =
        "Couldn't open the camera. Allow camera access in your browser settings, or <a href='#/solve'>tap the colors in</a>.";
    }
  };

  const finish = () => {
    // Faces were scanned in U F R B L D order; the cube state wants U R F D L B.
    const samples = STATE_ORDER.flatMap((f) => faces[ORDER.indexOf(f)]);
    saveEntered(classify(samples));
    location.hash = "#/solve/check";
  };

  shoot.addEventListener("click", () => {
    if (!stream) return void start();
    capture();
  });

  function capture() {
    drawFrame(); // read the newest frame, not the last one painted
    faces.push(sampleFace(ctx.getImageData(0, 0, PREVIEW, PREVIEW)));
    if (faces.length === 6) return finish();
    showStep();
  }
  redo.addEventListener("click", () => {
    faces.pop();
    showStep();
  });

  showStep();

  // Test hook: ?autoscan=1 opens the camera and captures all 6 faces from it.
  if (new URLSearchParams(location.search).get("autoscan") === "1") {
    void start().then(async () => {
      for (let k = 0; k < 6; k++) {
        await new Promise((r) => setTimeout(r, 300));
        capture();
      }
    });
  }

  return {
    dispose() {
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((t) => t.stop());
    },
  };
}
