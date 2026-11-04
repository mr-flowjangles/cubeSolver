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
  // Camera: the view always comes back to "home" (the front), so button letters
  // always match what the player sees. Dragging is limited to about 40° each way.
  private home = new THREE.Spherical();
  private fly: { from: THREE.Spherical; to: THREE.Spherical; start: number; ms: number } | null =
    null;
  private peeking = false;
  private tags: THREE.Sprite[] = [];

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

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;
    this.controls.enableZoom = false;
    this.controls.enableDamping = false; // leftover drag motion would fight the snap back
    this.controls.addEventListener("end", () => {
      if (!this.peeking) this.snapHome();
    });
    this.setHome(new THREE.Vector3(5.2, 4.4, 7.2));

    this.buildPieces();
    this.buildTags("above");
    this.paint();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.renderer.setAnimationLoop((now) => {
      if (this.fly) this.stepFly(now);
      else this.controls.update();
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

  /** Light up these stickers (a piece and the spot it's going) and dim the rest; null clears it. */
  spotlight(lit: readonly number[] | null) {
    const on = new Set(lit ?? []);
    this.stickers.forEach((m, i) =>
      m.material.color.setHex(!lit || on.has(i) ? 0xffffff : 0x5a5a5a),
    );
  }

  /** Look from slightly above (default) or below, e.g. to see a white cross on the bottom. */
  lookFrom(side: "above" | "below") {
    this.setHome(new THREE.Vector3(5.2, side === "above" ? 4.4 : -4.4, 7.2));
    this.buildTags(side);
  }

  /** Make `pos` the home view and limit dragging to about 40° around it. */
  private setHome(pos: THREE.Vector3) {
    this.fly = null;
    this.home.setFromVector3(pos);
    this.camera.position.copy(pos);
    this.camera.lookAt(0, 0, 0);
    this.setLimits(true);
    this.controls.update();
  }

  private setLimits(on: boolean) {
    const lim = (40 * Math.PI) / 180;
    const c = this.controls;
    c.minAzimuthAngle = on ? this.home.theta - lim : -Infinity;
    c.maxAzimuthAngle = on ? this.home.theta + lim : Infinity;
    c.minPolarAngle = on ? Math.max(0.05, this.home.phi - lim) : 0.05;
    c.maxPolarAngle = on ? Math.min(Math.PI - 0.05, this.home.phi + lim) : Math.PI - 0.05;
  }

  /** Glide back to the front view. */
  snapHome(ms = 350) {
    this.peeking = false;
    this.showTags(true);
    this.setLimits(true);
    this.flyTo(this.home, ms);
  }

  /** Swing round to see the back, or back to the front if already peeking. */
  togglePeek(): boolean {
    if (this.peeking) {
      this.snapHome(500);
      return false;
    }
    this.peeking = true;
    this.showTags(false); // the tags name the front sides; hide them while looking at the back
    this.setLimits(false);
    const back = this.home.clone();
    back.theta += Math.PI;
    this.flyTo(back, 500);
    return true;
  }

  get isPeeking() {
    return this.peeking;
  }

  private flyTo(to: THREE.Spherical, ms: number) {
    const from = new THREE.Spherical().setFromVector3(this.camera.position);
    // Take the short way round.
    let d = to.theta - from.theta;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    const target = to.clone();
    target.theta = from.theta + d;
    this.fly = { from, to: target, start: performance.now(), ms };
  }

  private stepFly(now: number) {
    const f = this.fly!;
    const t = Math.min(1, (now - f.start) / f.ms);
    const e = 1 - (1 - t) ** 3;
    const s = new THREE.Spherical(
      f.from.radius + (f.to.radius - f.from.radius) * e,
      f.from.phi + (f.to.phi - f.from.phi) * e,
      f.from.theta + (f.to.theta - f.from.theta) * e,
    );
    this.camera.position.setFromSpherical(s);
    this.camera.lookAt(0, 0, 0);
    if (t >= 1) {
      this.fly = null;
      this.controls.update();
    }
  }

  /**
   * Labels fixed in space next to the faces: "FRONT · F", "TOP · U", "RIGHT · R".
   * They don't turn with the cube, which shows that letters mean places, not colors.
   */
  private buildTags(side: "above" | "below") {
    for (const t of this.tags) this.scene.remove(t);
    const tags: [string, [number, number, number]][] = [
      ["FRONT · F", [0, 0, 2.35]],
      ["RIGHT · R", [2.35, 0, 0]],
      side === "above" ? ["TOP · U", [0, 2.1, 0]] : ["BOTTOM · D", [0, -2.1, 0]],
    ];
    this.tags = tags.map(([text, pos]) => {
      const c = document.createElement("canvas");
      c.width = 256;
      c.height = 64;
      const g = c.getContext("2d")!;
      g.fillStyle = "rgba(20,22,27,0.75)";
      g.beginPath();
      g.roundRect(4, 8, 248, 48, 24);
      g.fill();
      g.fillStyle = "#fff";
      g.font = "bold 28px system-ui, sans-serif";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(text, 128, 33);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
      sprite.scale.set(1.6, 0.4, 1);
      sprite.position.set(...pos);
      sprite.renderOrder = 10;
      this.scene.add(sprite);
      return sprite;
    });
  }

  showTags(on: boolean) {
    for (const t of this.tags) t.visible = on;
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
