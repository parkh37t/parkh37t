"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export type HouseParams = {
  floors: number; // red-brick floors above ground
  floorHeight: number;
  width: number;
  depth: number;
  basement: number; // exposed semi-basement height
  sunroom: boolean; // corner glazed balcony (통유리 베란다)
  gate: boolean; // boundary wall + 대문
  carport: boolean; // canopy + parked SUV
  context: boolean; // neighbour buildings
};

export const HOUSE_DEFAULTS: HouseParams = {
  floors: 2,
  floorHeight: 2.7,
  width: 9,
  depth: 9.5,
  basement: 1.1,
  sunroom: true,
  gate: true,
  carport: true,
  context: true,
};

type View = "front" | "corner" | "side" | "top";

type SceneApi = {
  rebuild: (p: HouseParams) => void;
  setView: (v: View) => void;
  setSpin: (on: boolean) => void;
  dispose: () => void;
};

// Imperative Three.js controller — models the actual red-brick house at
// 봉은사로 21길 57 (corner lot, hip clay-tile roof, glazed corner sunroom).
function createScene(container: HTMLDivElement): SceneApi {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  {
    const c = document.createElement("canvas");
    c.width = 2;
    c.height = 256;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, "#8fb6e8");
    g.addColorStop(0.55, "#bcd2ec");
    g.addColorStop(1, "#e7eef6");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 2, 256);
    scene.background = new THREE.CanvasTexture(c);
  }
  scene.fog = new THREE.Fog(0xcdd9e8, 70, 220);

  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    1000,
  );
  camera.position.set(22, 15, 26);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 8;
  controls.maxDistance = 95;
  controls.maxPolarAngle = Math.PI / 2.05;

  scene.add(new THREE.HemisphereLight(0xbcd6ff, 0x55524c, 0.8));
  const sun = new THREE.DirectionalLight(0xfff2d6, 2.1);
  sun.position.set(26, 38, 22);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 150;
  sun.shadow.camera.left = -42;
  sun.shadow.camera.right = 42;
  sun.shadow.camera.top = 42;
  sun.shadow.camera.bottom = -42;
  sun.shadow.bias = -0.0004;
  scene.add(sun);

  const std = (
    color: number,
    roughness: number,
    metalness = 0,
    extra: Partial<THREE.MeshStandardMaterialParameters> = {},
  ) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });

  const M = {
    brick: std(0x9c4a36, 0.96),
    paint: std(0xe8e3d8, 0.9), // white-painted lower wall
    band: std(0xefeae0, 0.8), // concrete lintels / sills / bands
    tile: std(0x9a4327, 0.82, 0, { side: THREE.DoubleSide }), // clay roof
    ridge: std(0x7c3520, 0.8),
    eave: std(0xf2efe6, 0.7),
    glass: std(0x2c3b42, 0.12, 0.25),
    frameW: std(0xf3f1ea, 0.6), // white window frames
    frameD: std(0x33363b, 0.5, 0.2), // dark sashes
    mint: std(0xbfe0d8, 0.8),
    door: std(0x2b2e33, 0.4, 0.5),
    gate: std(0x1b1b1e, 0.5, 0.6), // black 대문
    canopy: std(0xd2e7ea, 0.25, 0.1, {
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    }),
    suv: std(0x5a4636, 0.4, 0.5),
    suvGlass: std(0x141a1f, 0.2, 0.5),
    meter: std(0xb4b0a4, 0.7),
    ac: std(0xd7d7d2, 0.6),
    rail: std(0x2a2b2e, 0.5, 0.4),
    asphalt: std(0x3c3d42, 1),
    walk: std(0x9a9a97, 1),
    yard: std(0x70706a, 1),
    nWhite: std(0xcfcdc8, 0.95),
    nBrick: std(0x9d5743, 0.95),
  };
  const allMaterials = Object.values(M);

  const box = (
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
    shadow = true,
  ) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y + h / 2, z);
    m.castShadow = shadow;
    m.receiveShadow = true;
    return m;
  };

  // Hip roof (모임지붕) as a custom mesh; base at local y=0, ridge at height h.
  const hipRoof = (w: number, d: number, h: number, mat: THREE.Material) => {
    const hw = w / 2;
    const hd = d / 2;
    const pos: number[] = [];
    const idx: number[] = [];
    const add = (x: number, y: number, z: number) => {
      pos.push(x, y, z);
      return pos.length / 3 - 1;
    };
    const A = add(-hw, 0, -hd);
    const B = add(hw, 0, -hd);
    const C = add(hw, 0, hd);
    const E = add(-hw, 0, hd);
    if (w >= d) {
      const R1 = add(-hw + hd, h, 0);
      const R2 = add(hw - hd, h, 0);
      idx.push(A, B, R2, A, R2, R1); // back
      idx.push(C, E, R1, C, R1, R2); // front
      idx.push(B, C, R2); // right hip
      idx.push(E, A, R1); // left hip
    } else {
      const R1 = add(0, h, -hd + hw);
      const R2 = add(0, h, hd - hw);
      idx.push(A, E, R2, A, R2, R1); // left
      idx.push(C, B, R1, C, R1, R2); // right
      idx.push(B, A, R1); // back hip
      idx.push(E, C, R2); // front hip
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  // Punched window with concrete lintel + sill. Anchored at top-centre (y=0 = head).
  const punch = (w: number, h: number) => {
    const g = new THREE.Group();
    g.add(box(w, h, 0.05, M.glass, 0, -h, 0.02));
    g.add(box(w + 0.04, h, 0.04, M.frameD, 0, -h, 0.0)); // recessed reveal
    g.add(box(w + 0.22, 0.13, 0.14, M.band, 0, 0.0, 0.05)); // lintel
    g.add(box(w + 0.22, 0.1, 0.16, M.band, 0, -h - 0.06, 0.05)); // sill
    return g;
  };

  // Glazed sliding bay (large windows) with white frame + mullions.
  const glazedBay = (w: number, h: number, depth: number) => {
    const g = new THREE.Group();
    g.add(box(w, h, depth, M.glass, 0, -h, 0)); // glass body (anchored top)
    const t = 0.08;
    g.add(box(w, t, depth + 0.02, M.frameW, 0, -t, 0)); // head
    g.add(box(w, t, depth + 0.02, M.frameW, 0, -h, 0)); // sill rail
    const panes = Math.max(2, Math.round(w / 0.9));
    for (let i = 0; i <= panes; i++) {
      const x = -w / 2 + (w * i) / panes;
      g.add(box(t * 0.8, h, depth + 0.02, M.frameW, x, -h, 0));
    }
    g.add(box(w + 0.02, t, depth + 0.02, M.frameW, 0, -h / 2, 0)); // mid transom
    return g;
  };

  const env = new THREE.Group();
  scene.add(env);
  {
    env.add(box(150, 0.1, 150, M.asphalt, 0, -0.1, 0, false));
    env.add(box(60, 0.14, 6, M.walk, 0, -0.02, 16, false)); // front sidewalk
    env.add(box(6, 0.14, 60, M.walk, -16, -0.02, 0, false)); // side sidewalk (corner)
    for (let i = -60; i <= 60; i += 6) {
      const ln = box(0.16, 0.02, 2.4, M.band, -22, 0.02, i, false);
      env.add(ln); // yellow-ish curb dashes (use band colour)
    }
  }

  let house = new THREE.Group();
  scene.add(house);

  const disposeHouse = () => {
    house.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    });
    scene.remove(house);
  };

  const build = (p: HouseParams) => {
    disposeHouse();
    house = new THREE.Group();
    scene.add(house);

    const W = p.width;
    const D = p.depth;
    const FH = p.floorHeight;
    const N = p.floors;
    const BASE = p.basement;
    const wallTop = BASE + N * FH; // top of brick walls (eaves level)

    // ---- main brick mass (basement + floors) ----
    house.add(box(W, wallTop, D, M.brick, 0, 0, 0));
    // painted concrete band at the basement top + each floor line
    house.add(box(W + 0.08, 0.14, D + 0.08, M.band, 0, BASE - 0.07, 0));
    for (let f = 1; f < N; f++) {
      house.add(box(W + 0.06, 0.12, D + 0.06, M.band, 0, BASE + f * FH - 0.06, 0));
    }

    // ---- semi-basement low windows + mint entrance ----
    house.add(box(2.2, BASE * 0.92, 0.12, M.mint, -W * 0.18, 0, D / 2 + 0.02)); // recess
    house.add(box(1.0, BASE * 0.86, 0.06, M.door, -W * 0.18, 0, D / 2 + 0.09)); // dark door
    for (const x of [W * 0.16, W * 0.34]) {
      const bw = punch(1.0, 0.5);
      bw.position.set(x, 0.78, D / 2 + 0.03);
      house.add(bw);
    }
    // basement window on the visible side
    const bsw = punch(1.0, 0.5);
    bsw.position.set(-W / 2 - 0.03, 0.78, D * 0.2);
    bsw.rotation.y = -Math.PI / 2;
    house.add(bsw);

    // ---- floors: front glazed bays + punched side/back windows ----
    for (let f = 0; f < N; f++) {
      const sillY = BASE + f * FH + 0.5;
      const winTop = sillY + FH * 0.62;
      const topFloor = f === N - 1;

      // front: large glazed bay (top floor projects = sunroom)
      const bayW = W * 0.62;
      const bayDepth = topFloor && p.sunroom ? 0.65 : 0.12;
      const bay = glazedBay(bayW, FH * 0.66, bayDepth);
      bay.position.set(-W * 0.05, winTop, D / 2 + bayDepth / 2 + 0.02);
      house.add(bay);

      // top-floor corner return (wraps the sunroom around the left corner)
      if (topFloor && p.sunroom) {
        const ret = glazedBay(D * 0.34, FH * 0.66, 0.6);
        ret.position.set(-W / 2 - 0.3, winTop, D * 0.28);
        ret.rotation.y = -Math.PI / 2;
        house.add(ret);
      }

      // side (+x): two punched windows
      for (const z of [D * 0.26, -D * 0.18]) {
        const sw = punch(1.0, FH * 0.5);
        sw.position.set(W / 2 + 0.03, winTop, z);
        sw.rotation.y = Math.PI / 2;
        house.add(sw);
      }
      // side (-x): one punched window (rest is sunroom return on top)
      if (!(topFloor && p.sunroom)) {
        const sw = punch(1.0, FH * 0.5);
        sw.position.set(-W / 2 - 0.03, winTop, -D * 0.2);
        sw.rotation.y = -Math.PI / 2;
        house.add(sw);
      }
      // back (-z): two punched windows
      for (const x of [-W * 0.22, W * 0.22]) {
        const bw = punch(1.0, FH * 0.5);
        bw.position.set(x, winTop, -D / 2 - 0.03);
        bw.rotation.y = Math.PI;
        house.add(bw);
      }
    }

    // ---- hip clay-tile roof with overhang ----
    const ov = 0.7;
    const rW = W + 2 * ov;
    const rD = D + 2 * ov;
    const rH = Math.min(rW, rD) * 0.42;
    house.add(box(rW, 0.12, rD, M.eave, 0, wallTop - 0.06, 0)); // white soffit/eave
    const roof = hipRoof(rW, rD, rH, M.tile);
    roof.position.y = wallTop;
    house.add(roof);
    // ridge cap + chimney
    if (rW >= rD) {
      house.add(box(rW - rD + 0.2, 0.18, 0.3, M.ridge, 0, wallTop + rH - 0.05, 0));
    } else {
      house.add(box(0.3, 0.18, rD - rW + 0.2, M.ridge, 0, wallTop + rH - 0.05, 0));
    }
    house.add(box(0.7, 1.1, 0.7, M.brick, W * 0.3, wallTop + rH * 0.5, -D * 0.3));

    // ---- wall details: AC units, gas meters ----
    house.add(box(0.85, 0.6, 0.4, M.ac, -W * 0.05, BASE + (N - 1) * FH + 0.1, D / 2 + 0.3));
    house.add(box(0.8, 0.5, 0.35, M.ac, W / 2 + 0.25, BASE + 0.4, -D * 0.18));
    for (let i = 0; i < 3; i++) {
      house.add(box(0.26, 0.4, 0.18, M.meter, W / 2 + 0.12, BASE + 0.2, D * 0.3 - i * 0.32));
    }

    // ---- boundary wall + 대문 (front + side, corner lot) ----
    if (p.gate) {
      const wallH = 1.5;
      const fz = D / 2 + 3.0; // front boundary
      const sx = -W / 2 - 3.0; // side boundary
      const fLen = W + 6;
      const sLen = D + 6;
      // front wall (with gate opening near left)
      const gateW = 2.2;
      const leftLen = fLen / 2 - 1.0 - gateW; // segment left of gate
      house.add(
        box(leftLen, wallH * 0.78, 0.3, M.paint, -fLen / 2 + leftLen / 2, 0, fz),
      );
      house.add(box(leftLen, 0.32, 0.4, M.brick, -fLen / 2 + leftLen / 2, wallH * 0.78, fz));
      const rightStart = -fLen / 2 + leftLen + gateW;
      const rightLen = fLen - (leftLen + gateW);
      house.add(box(rightLen, wallH * 0.78, 0.3, M.paint, rightStart + rightLen / 2, 0, fz));
      house.add(box(rightLen, 0.32, 0.4, M.brick, rightStart + rightLen / 2, wallH * 0.78, fz));
      // brick gate post with address plate "57"
      const postX = -fLen / 2 + leftLen + gateW + 0.15;
      house.add(box(0.5, 2.0, 0.5, M.brick, postX, 0, fz));
      house.add(box(0.26, 0.34, 0.04, M.glass, postX, 1.35, fz + 0.26)); // blue plate
      // black ornate double gate
      const gx = -fLen / 2 + leftLen + gateW / 2;
      house.add(box(gateW, 1.7, 0.08, M.gate, gx, 0, fz));
      for (let i = 0; i < 6; i++) {
        house.add(box(0.04, 1.4, 0.1, M.rail, gx - gateW / 2 + 0.2 + i * ((gateW - 0.4) / 5), 0.15, fz + 0.05));
      }
      // side wall
      house.add(box(0.3, wallH * 0.78, sLen, M.paint, sx, 0, fz - 3.0 - sLen / 2));
      house.add(box(0.4, 0.32, sLen, M.brick, sx, wallH * 0.78, fz - 3.0 - sLen / 2));
    }

    // ---- carport canopy + parked SUV (side alley) ----
    if (p.carport) {
      const cx = W / 2 + 1.9;
      const cz = D * 0.05;
      const len = 5.2;
      // curved translucent canopy (half cylinder)
      const canopy = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, len, 20, 1, true, 0, Math.PI),
        M.canopy,
      );
      canopy.rotation.z = Math.PI / 2;
      canopy.rotation.y = Math.PI / 2;
      canopy.position.set(cx, 2.3, cz);
      canopy.castShadow = false;
      house.add(canopy);
      // SUV (brown)
      const suv = new THREE.Group();
      suv.position.set(cx, 0, cz);
      suv.add(box(2.0, 0.95, 4.6, M.suv, 0, 0.45, 0));
      suv.add(box(1.9, 0.75, 2.6, M.suv, 0, 1.35, -0.1));
      suv.add(box(1.84, 0.6, 2.3, M.suvGlass, 0, 1.45, -0.1));
      for (const [wx, wz] of [
        [-0.95, 1.5],
        [0.95, 1.5],
        [-0.95, -1.5],
        [0.95, -1.5],
      ] as Array<[number, number]>) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.28, 18), M.rail);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.42, wz);
        wheel.castShadow = true;
        suv.add(wheel);
      }
      house.add(suv);
    }

    // small concrete yard inside the wall
    house.add(box(W + 5, 0.08, 3.0, M.yard, 0, 0, D / 2 + 1.6, false));

    // ---- context neighbours ----
    if (p.context) {
      const nb = box(11, 13, 9, M.nWhite, 14, 0, 8); // white-tile building (right)
      house.add(nb);
      house.add(box(9, 11, 10, M.nBrick, -3, 0, -16)); // brick building (back-left)
      house.add(box(10, 14, 9, M.nWhite, 15, 0, -10));
    }

    controls.target.set(0, wallTop * 0.5, 0);
  };

  const VIEWS: Record<View, [number, number, number]> = {
    front: [0, 9, 34],
    corner: [22, 14, 26],
    side: [36, 10, 4],
    top: [2, 40, 6],
  };

  let spinning = false;
  let raf = 0;
  const tick = () => {
    if (spinning) {
      const a = 0.0035;
      const { x, z } = camera.position;
      camera.position.x = x * Math.cos(a) - z * Math.sin(a);
      camera.position.z = x * Math.sin(a) + z * Math.cos(a);
    }
    controls.update();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };
  tick();

  const ro = new ResizeObserver(() => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
  ro.observe(container);

  return {
    rebuild: build,
    setView: (v) => camera.position.set(...VIEWS[v]),
    setSpin: (on) => {
      spinning = on;
    },
    dispose: () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      disposeHouse();
      env.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
      allMaterials.forEach((m) => m.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}

// ---------------- React wrapper ----------------

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-[13px] font-medium text-ink mb-1.5">
        {label}
        <b className="text-accent-lavenderDeep font-bold tabular-nums">
          {value}
          {unit}
        </b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-accent-lavender cursor-pointer"
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-[13px] font-medium text-ink cursor-pointer select-none">
      <input
        type="checkbox"
        className="chk"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

export function House3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<SceneApi | null>(null);
  const [params, setParams] = useState<HouseParams>(HOUSE_DEFAULTS);
  const [spin, setSpin] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;
    const api = createScene(mountRef.current);
    apiRef.current = api;
    api.rebuild(HOUSE_DEFAULTS);
    return () => {
      api.dispose();
      apiRef.current = null;
    };
  }, []);

  useEffect(() => {
    apiRef.current?.rebuild(params);
  }, [params]);

  useEffect(() => {
    apiRef.current?.setSpin(spin);
  }, [spin]);

  const set = <K extends keyof HouseParams>(key: K, value: HouseParams[K]) =>
    setParams((p) => ({ ...p, [key]: value }));

  return (
    <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
      <div className="card !p-5 h-max">
        <div className="text-[13px] font-semibold text-ink mb-4">🏠 모델 조정</div>
        <div className="space-y-4">
          <Slider
            label="지상 층수"
            value={params.floors}
            min={1}
            max={3}
            step={1}
            onChange={(v) => set("floors", v)}
          />
          <Slider
            label="한 층 높이"
            value={params.floorHeight}
            min={2.4}
            max={3.2}
            step={0.1}
            unit=" m"
            onChange={(v) => set("floorHeight", v)}
          />
          <Slider
            label="건물 폭"
            value={params.width}
            min={6}
            max={13}
            step={0.5}
            unit=" m"
            onChange={(v) => set("width", v)}
          />
          <Slider
            label="건물 깊이"
            value={params.depth}
            min={7}
            max={15}
            step={0.5}
            unit=" m"
            onChange={(v) => set("depth", v)}
          />
          <Slider
            label="반지하 노출 높이"
            value={params.basement}
            min={0}
            max={1.8}
            step={0.1}
            unit=" m"
            onChange={(v) => set("basement", v)}
          />
        </div>

        <div className="my-4 h-px bg-zinc-100" />
        <div className="grid grid-cols-2 gap-2.5">
          <Toggle
            label="통유리 베란다"
            checked={params.sunroom}
            onChange={(v) => set("sunroom", v)}
          />
          <Toggle label="담장·대문" checked={params.gate} onChange={(v) => set("gate", v)} />
          <Toggle label="주차 캐노피" checked={params.carport} onChange={(v) => set("carport", v)} />
          <Toggle label="주변 건물" checked={params.context} onChange={(v) => set("context", v)} />
        </div>

        <div className="my-4 h-px bg-zinc-100" />
        <div className="grid grid-cols-4 gap-1.5">
          {(
            [
              ["front", "정면"],
              ["corner", "코너"],
              ["side", "측면"],
              ["top", "상단"],
            ] as Array<[View, string]>
          ).map(([v, label]) => (
            <button
              key={v}
              onClick={() => apiRef.current?.setView(v)}
              className="h-9 rounded-xl border border-zinc-200 bg-white text-[12px] font-semibold text-ink-muted hover:text-ink hover:border-accent-lavender transition"
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setSpin((s) => !s)}
          className={
            "mt-2.5 h-9 w-full rounded-xl text-[12px] font-semibold transition " +
            (spin
              ? "bg-ink text-white"
              : "border border-zinc-200 bg-white text-ink-muted hover:text-ink")
          }
        >
          {spin ? "자동회전 멈춤" : "자동회전 시작"}
        </button>
        <button
          onClick={() => setParams(HOUSE_DEFAULTS)}
          className="mt-2.5 h-9 w-full rounded-xl text-[12px] font-semibold text-ink-muted hover:text-ink transition"
        >
          기본값으로 초기화
        </button>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div
          ref={mountRef}
          className="h-[460px] lg:h-[620px] w-full"
          aria-label="3D 집 모델 뷰포트"
        />
        <div className="px-5 py-3 text-[12px] text-ink-muted border-t border-zinc-100">
          드래그 = 회전 · 휠 = 줌 · 우클릭 드래그 = 이동
        </div>
      </div>
    </div>
  );
}
