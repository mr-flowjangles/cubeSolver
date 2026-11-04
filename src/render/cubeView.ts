// Draws a cube state in 3D and animates moves.
// The picture is always rebuilt from the cube state after each move,
// so the drawing can never drift from the model.

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { type CubeState, type Face, type Move, STICKERS, moveTurn } from "../cube";
import { STICKER_COLOR } from "../cube";
import { ADA_SHAPE, drawShape } from "./shapes";

const GAP = 1.02; // spacing between pieces
const STICKER_SIZE = 0.84;

export interface CubeViewOptions {
  ada?: boolean;
}

export class CubeView {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  private controls: OrbitControls;
  private pieces = new Map<string, THREE.Group>(); // by "x,y,z"
  private stickers: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[] = [];
  private textures: Record<string, THREE.CanvasTexture> = {};
  private state: CubeState;
  private ada: boolean;
  private queue: { move: Move; next: CubeState; ms: number; done: () => void }[] = [];
  private animating = false;
  private resizeObserver: ResizeObserver;

  constructor(
    private container: HTMLElement,
    state: CubeState,
    options: CubeViewOptions = {},
  ) {
    this.state = state;
    this.ada = options.ada ?? false;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.camera.position.set(5.2, 4.4, 7.2);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;
    this.controls.enableDamping = true;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 16;

    this.buildPieces();
    this.paint();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.renderer.setAnimationLoop(() => {
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    });
  }

  private buildPieces() {
    const body = new THREE.BoxGeometry(0.98, 0.98, 0.98);
    const bodyMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    for (let x = -1; x <= 1; x++)
      for (let y = -1; y <= 1; y++)
        for (let z = -1; z <= 1; z++) {
          if (!x && !y && !z) continue;
          const g = new THREE.Group();
          g.position.set(x * GAP, y * GAP, z * GAP);
          g.add(new THREE.Mesh(body, bodyMat));
          this.pieces.set(`${x},${y},${z}`, g);
          this.scene.add(g);
        }

    const plane = new THREE.PlaneGeometry(STICKER_SIZE, STICKER_SIZE);
    for (const s of STICKERS) {
      const mesh = new THREE.Mesh(plane, new THREE.MeshBasicMaterial());
      const n = new THREE.Vector3(...s.normal);
      mesh.position.copy(n.clone().multiplyScalar(0.5 + 0.002));
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
      this.pieces.get(s.position.join(","))!.add(mesh);
      this.stickers.push(mesh);
    }
  }

  private texture(face: Face): THREE.CanvasTexture {
    const k = face + (this.ada ? "+" : "");
    if (this.textures[k]) return this.textures[k];
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    g.fillStyle = STICKER_COLOR[face];
    g.beginPath();
    g.roundRect(0, 0, 128, 128, 18);
    g.fill();
    if (this.ada) {
      g.fillStyle = face === "U" || face === "D" ? "#222" : "#fff";
      drawShape(g, ADA_SHAPE[face], 64, 64, 34);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return (this.textures[k] = t);
  }

  private paint() {
    this.stickers.forEach((mesh, i) => {
      mesh.material.map = this.texture(this.state[i]);
      mesh.material.needsUpdate = true;
    });
  }

  private resize() {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Keep the whole cube in view on narrow (phone) screens.
    this.camera.zoom = Math.min(1, w / h);
    this.camera.updateProjectionMatrix();
  }

  /** Light up the stickers a move will turn and dim the rest; null clears it. */
  highlight(move: Move | null) {
    const turn = move ? moveTurn(move) : null;
    STICKERS.forEach((s, i) => {
      const p = s.position;
      const lit =
        !turn || turn.inLayer(p[0] * turn.axis[0] + p[1] * turn.axis[1] + p[2] * turn.axis[2]);
      this.stickers[i].material.color.setHex(lit ? 0xffffff : 0x4a4a4a);
    });
  }

  /** Look from slightly above (default) or below, e.g. to see a white cross on the bottom. */
  lookFrom(side: "above" | "below") {
    this.camera.position.set(5.2, side === "above" ? 4.4 : -4.4, 7.2);
    this.controls.update();
  }

  setAda(on: boolean) {
    this.ada = on;
    this.paint();
  }

  /** Jump to a state with no animation. Cancels queued moves. */
  setState(state: CubeState) {
    this.queue.forEach((q) => q.done());
    this.queue = [];
    this.state = state;
    if (!this.animating) this.paint();
  }

  /** Animate one move, ending on `next` (the state after the move). */
  animate(move: Move, next: CubeState, ms = 220): Promise<void> {
    return new Promise((done) => {
      this.queue.push({ move, next, ms, done });
      if (!this.animating) void this.runQueue();
    });
  }

  get busy() {
    return this.animating || this.queue.length > 0;
  }

  private async runQueue() {
    this.animating = true;
    while (this.queue.length) {
      const { move, next, ms, done } = this.queue.shift()!;
      await this.turn(move, ms);
      this.state = next;
      this.paint();
      done();
    }
    this.animating = false;
    this.paint();
  }

  private turn(move: Move, ms: number): Promise<void> {
    const { axis, inLayer, turns } = moveTurn(move);
    const a = new THREE.Vector3(...axis);
    const pivot = new THREE.Group();
    this.scene.add(pivot);
    const moving: THREE.Group[] = [];
    for (const [k, g] of this.pieces) {
      const p = k.split(",").map(Number);
      if (inLayer(p[0] * axis[0] + p[1] * axis[1] + p[2] * axis[2])) {
        moving.push(g);
        pivot.attach(g);
      }
    }
    const angle = -(Math.PI / 2) * (turns === 3 ? -1 : turns);
    const duration = turns === 2 ? ms * 1.5 : ms;
    const start = performance.now();
    return new Promise((resolve) => {
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const ease = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
        pivot.setRotationFromAxisAngle(a, angle * ease);
        if (t < 1) return requestAnimationFrame(step);
        // Put pieces back where they started; the new colors are painted from the state.
        pivot.rotation.set(0, 0, 0);
        for (const g of moving) this.scene.attach(g);
        for (const g of moving) {
          const [x, y, z] = [...this.pieces]
            .find(([, v]) => v === g)![0]
            .split(",")
            .map(Number);
          g.position.set(x * GAP, y * GAP, z * GAP);
          g.rotation.set(0, 0, 0);
        }
        this.scene.remove(pivot);
        resolve();
      };
      requestAnimationFrame(step);
    });
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
