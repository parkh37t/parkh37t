"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export type HouseParams = {
  floors: number;
  floorHeight: number;
  width: number;
  depth: number;
  units: number;
  piloti: boolean;
  oktap: boolean;
  tank: boolean;
  ac: boolean;
};

export const HOUSE_DEFAULTS: HouseParams = {
  floors: 4,
  floorHeight: 2.8,
  width: 9,
  depth: 13,
  units: 2,
  piloti: true,
  oktap: true,
  tank: true,
  ac: true,
};

type View = "front" | "corner" | "side" | "top";

type SceneApi = {
  rebuild: (p: HouseParams) => void;
  setView: (v: View) => void;
  setSpin: (on: boolean) => void;
  dispose: () => void;
};

// Imperative Three.js controller. Lives outside React render so the WebGL
// context is created exactly once; React only feeds it params.
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
  scene.fog = new THREE.Fog(0xcdd9e8, 70, 200);

  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    1000,
  );
  camera.position.set(24, 18, 28);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 8;
  controls.maxDistance = 95;
  controls.maxPolarAngle = Math.PI / 2.05;

  scene.add(new THREE.HemisphereLight(0xbcd6ff, 0x55524c, 0.75));
  const sun = new THREE.DirectionalLight(0xfff2d6, 2.2);
  sun.position.set(28, 40, 18);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 140;
  sun.shadow.camera.left = -40;
  sun.shadow.camera.right = 40;
  sun.shadow.camera.top = 40;
  sun.shadow.camera.bottom = -40;
  sun.shadow.bias = -0.0004;
  scene.add(sun);

  const M = {
    wall: new THREE.MeshStandardMaterial({ color: 0xddd3c4, roughness: 0.92 }),
    base: new THREE.MeshStandardMaterial({ color: 0x8d8478, roughness: 0.85 }),
    trim: new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.7 }),
    frame: new THREE.MeshStandardMaterial({ color: 0x2b2c30, roughness: 0.6, metalness: 0.3 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x35505f, roughness: 0.12, metalness: 0.2 }),
    door: new THREE.MeshStandardMaterial({ color: 0x3a3f47, roughness: 0.4, metalness: 0.5 }),
    rail: new THREE.MeshStandardMaterial({ color: 0x1f2024, roughness: 0.5, metalness: 0.4 }),
    roof: new THREE.MeshStandardMaterial({ color: 0x6f6b64, roughness: 0.95 }),
    tank: new THREE.MeshStandardMaterial({ color: 0x9fb8c4, roughness: 0.4, metalness: 0.2 }),
    ac: new THREE.MeshStandardMaterial({ color: 0xd7d7d2, roughness: 0.6 }),
    car: new THREE.MeshStandardMaterial({ color: 0x394150, roughness: 0.35, metalness: 0.6 }),
    carGlass: new THREE.MeshStandardMaterial({ color: 0x10141a, roughness: 0.2, metalness: 0.5 }),
    asphalt: new THREE.MeshStandardMaterial({ color: 0x3c3d42, roughness: 1 }),
    walk: new THREE.MeshStandardMaterial({ color: 0x9a9a97, roughness: 1 }),
    yard: new THREE.MeshStandardMaterial({ color: 0x6f7d52, roughness: 1 }),
    neighbor: new THREE.MeshStandardMaterial({ color: 0xb9b7b2, roughness: 0.95 }),
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

  // ---- static environment (built once) ----
  const env = new THREE.Group();
  scene.add(env);
  {
    const road = box(140, 0.1, 140, M.asphalt, 0, -0.1, 0, false);
    env.add(road);
    env.add(box(44, 0.14, 7, M.walk, 0, -0.02, 13, false));
    for (let i = -54; i <= 54; i += 6) {
      env.add(box(2.4, 0.02, 0.28, M.trim, i, 0.02, 22, false));
    }
    const nh: Array<[number, number, number, number, number]> = [
      [-16, 5, 10, 8, 14],
      [16, 6, 10, 9, 13],
      [-15, 4.5, -14, 11, 10],
      [15, 5.5, -13, 10, 12],
      [0, 7, -18, 14, 11],
    ];
    for (const [x, h, z, w, d] of nh) {
      env.add(box(w, h, d, M.neighbor, x, 0, z));
    }
  }

  // ---- parametric house ----
  let house = new THREE.Group();
  scene.add(house);

  const disposeHouse = () => {
    house.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    });
    scene.remove(house);
  };

  const windowUnit = (w: number, h: number) => {
    const g = new THREE.Group();
    const t = 0.07;
    g.add(box(w, h, 0.06, M.glass, 0, -h, 0));
    g.add(box(w, t, 0.1, M.frame, 0, -t, 0.02));
    g.add(box(w, t, 0.1, M.frame, 0, -h, 0.02));
    g.add(box(t, h, 0.1, M.frame, -w / 2 + t / 2, -h, 0.02));
    g.add(box(t, h, 0.1, M.frame, w / 2 - t / 2, -h, 0.02));
    g.add(box(t, h, 0.09, M.frame, 0, -h, 0.02));
    return g; // anchored at top-center (y = 0 is top edge)
  };

  const build = (p: HouseParams) => {
    disposeHouse();
    house = new THREE.Group();
    scene.add(house);

    const pilotiH = p.piloti ? 2.6 : 0;
    const baseY = pilotiH;
    const W = p.width;
    const D = p.depth;
    const FH = p.floorHeight;
    const N = p.floors;
    const topY = baseY + N * FH;

    if (p.piloti) {
      const cols: Array<[number, number]> = [
        [-W / 2 + 0.5, -D / 2 + 0.5],
        [W / 2 - 0.5, -D / 2 + 0.5],
        [-W / 2 + 0.5, D / 2 - 0.5],
        [W / 2 - 0.5, D / 2 - 0.5],
        [0, -D / 2 + 0.5],
      ];
      for (const [x, z] of cols) house.add(box(0.55, pilotiH, 0.55, M.base, x, 0, z));
      house.add(box(W * 0.34, pilotiH, D * 0.32, M.base, W * 0.22, 0, -D * 0.28));
      house.add(box(0.9, pilotiH * 0.96, 0.06, M.door, W * 0.05, 0, -D * 0.28 + D * 0.16));
      const car = new THREE.Group();
      car.position.set(-W * 0.18, 0, D * 0.18);
      car.add(box(1.9, 0.7, 4.4, M.car, 0, 0.35, 0));
      car.add(box(1.8, 0.6, 2.4, M.carGlass, 0, 1.0, -0.1));
      for (const [cx, cz] of [
        [-0.95, 1.4],
        [0.95, 1.4],
        [-0.95, -1.4],
        [0.95, -1.4],
      ] as Array<[number, number]>) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.25, 18), M.rail);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(cx, 0.34, cz);
        wheel.castShadow = true;
        car.add(wheel);
      }
      house.add(car);
      house.add(box(W, 0.3, D, M.base, 0, pilotiH - 0.3, 0));
    } else {
      house.add(box(W, pilotiH, D, M.base, 0, 0, 0));
    }

    house.add(box(W, N * FH, D, M.wall, 0, baseY, 0));
    if (!p.piloti) {
      house.add(box(1.4, 2.2, 0.12, M.door, -W * 0.25, 0, D / 2 + 0.02));
      house.add(box(2.0, 0.25, 1.0, M.trim, -W * 0.25, 2.2, D / 2 - 0.3));
    }

    for (let f = 0; f <= N; f++) {
      const y = baseY + f * FH;
      house.add(box(W + 0.18, 0.16, D + 0.18, M.trim, 0, y - 0.08, 0));
    }

    const winH = FH * 0.55;
    const winY = 0.78;
    const placeRow = (face: "front" | "back" | "left" | "right") => {
      for (let f = 0; f < N; f++) {
        const yTop = baseY + f * FH + winY + winH;
        if (face === "front" || face === "back") {
          const z = face === "front" ? D / 2 + 0.04 : -D / 2 - 0.04;
          const count = p.units;
          const slotW = W / count;
          for (let i = 0; i < count; i++) {
            const x = -W / 2 + slotW * (i + 0.5);
            const wu = windowUnit(Math.min(slotW * 0.62, 2.2), winH);
            wu.position.set(x, yTop, z);
            if (face === "back") wu.rotation.y = Math.PI;
            house.add(wu);
            if (face === "front") {
              house.add(
                box(
                  Math.min(slotW * 0.7, 2.4),
                  0.6,
                  0.06,
                  M.rail,
                  x,
                  baseY + f * FH,
                  D / 2 + 0.18,
                ),
              );
            }
          }
        } else {
          const x = face === "left" ? -W / 2 - 0.04 : W / 2 + 0.04;
          const wu = windowUnit(Math.min(D * 0.3, 1.6), winH);
          wu.position.set(x, yTop, -D * 0.12);
          wu.rotation.y = face === "left" ? -Math.PI / 2 : Math.PI / 2;
          house.add(wu);
        }
      }
    };
    placeRow("front");
    placeRow("back");
    placeRow("left");
    placeRow("right");

    house.add(box(W + 0.2, 0.3, D + 0.2, M.roof, 0, topY, 0));
    const pp = 0.7;
    const t = 0.14;
    house.add(box(W + 0.2, pp, t, M.trim, 0, topY + 0.3, D / 2 + 0.03));
    house.add(box(W + 0.2, pp, t, M.trim, 0, topY + 0.3, -D / 2 - 0.03));
    house.add(box(t, pp, D + 0.2, M.trim, W / 2 + 0.03, topY + 0.3, 0));
    house.add(box(t, pp, D + 0.2, M.trim, -W / 2 - 0.03, topY + 0.3, 0));

    const roofTop = topY + 0.3;
    if (p.oktap) {
      const ow = Math.min(W * 0.5, 4);
      const od = Math.min(D * 0.4, 4.5);
      const oh = 2.5;
      house.add(box(ow, oh, od, M.wall, -W * 0.12, roofTop, -D * 0.18));
      house.add(box(ow + 0.16, 0.18, od + 0.16, M.roof, -W * 0.12, roofTop + oh, -D * 0.18));
      const ow2 = windowUnit(1.2, 1.1);
      ow2.position.set(-W * 0.12, roofTop + 2.0, -D * 0.18 + od / 2 + 0.04);
      house.add(ow2);
      for (let i = 0; i <= 6; i++) {
        const x = -W / 2 + W * (i / 6);
        house.add(box(0.05, 1.0, 0.05, M.rail, x, roofTop, D / 2 - 0.1));
      }
      house.add(box(W, 0.05, 0.05, M.rail, 0, roofTop + 1.0, D / 2 - 0.1));
    }
    if (p.tank) {
      house.add(box(2.0, 0.4, 2.0, M.roof, W * 0.28, roofTop, D * 0.28));
      const tk = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.4, 20), M.tank);
      tk.position.set(W * 0.28, roofTop + 0.4 + 0.7, D * 0.28);
      tk.castShadow = true;
      house.add(tk);
    }
    if (p.ac) {
      for (let i = 0; i < N; i++) {
        const y = baseY + i * FH + 0.2;
        const z = -D / 2 + 0.9 + (i % 3);
        house.add(box(0.8, 0.6, 0.35, M.ac, W / 2 + 0.25, y, z));
      }
    }

    house.add(box(W + 4, 0.1, 2.2, M.yard, 0, 0, D / 2 + 1.6, false));
    for (let i = 0; i <= 8; i++) {
      const x = -(W + 3) / 2 + (W + 3) * (i / 8);
      house.add(box(0.06, 1.0, 0.06, M.rail, x, 0, D / 2 + 2.7));
    }
    house.add(box(W + 3, 0.06, 0.06, M.rail, 0, 1.0, D / 2 + 2.7));
    house.add(box(0.9, 0.4, 0.06, M.frame, -W / 2 + 0.7, pilotiH || 2.4, D / 2 + 0.05));

    controls.target.set(0, topY * 0.45, 0);
  };

  // ---- view presets ----
  const VIEWS: Record<View, [number, number, number]> = {
    front: [0, 12, 38],
    corner: [26, 18, 30],
    side: [40, 12, 0],
    top: [2, 46, 2],
  };

  // ---- loop ----
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

  // Create the scene once.
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

  // Feed params on change.
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
      {/* Controls */}
      <div className="card !p-5 h-max">
        <div className="text-[13px] font-semibold text-ink mb-4">🏠 모델 조정</div>
        <div className="space-y-4">
          <Slider
            label="지상 주거 층수"
            value={params.floors}
            min={2}
            max={7}
            step={1}
            onChange={(v) => set("floors", v)}
          />
          <Slider
            label="한 층 높이"
            value={params.floorHeight}
            min={2.4}
            max={3.4}
            step={0.1}
            unit=" m"
            onChange={(v) => set("floorHeight", v)}
          />
          <Slider
            label="건물 폭 (정면)"
            value={params.width}
            min={6}
            max={14}
            step={0.5}
            unit=" m"
            onChange={(v) => set("width", v)}
          />
          <Slider
            label="건물 깊이"
            value={params.depth}
            min={8}
            max={18}
            step={0.5}
            unit=" m"
            onChange={(v) => set("depth", v)}
          />
          <Slider
            label="한 층 세대 수"
            value={params.units}
            min={1}
            max={3}
            step={1}
            onChange={(v) => set("units", v)}
          />
        </div>

        <div className="my-4 h-px bg-zinc-100" />
        <div className="grid grid-cols-2 gap-2.5">
          <Toggle
            label="필로티 주차"
            checked={params.piloti}
            onChange={(v) => set("piloti", v)}
          />
          <Toggle label="옥탑방" checked={params.oktap} onChange={(v) => set("oktap", v)} />
          <Toggle label="물탱크" checked={params.tank} onChange={(v) => set("tank", v)} />
          <Toggle label="실외기" checked={params.ac} onChange={(v) => set("ac", v)} />
        </div>

        <div className="my-4 h-px bg-zinc-100" />
        <div className="grid grid-cols-4 gap-1.5">
          {(
            [
              ["front", "정면"],
              ["corner", "3/4"],
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

      {/* Viewport */}
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
