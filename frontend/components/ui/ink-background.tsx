"use client";

/**
 * @author: @dorianbaffier (adapted for Storsy & Tailwind 3)
 * @description: Interactive Ink Headline & Background from Kokonut UI
 * @license: MIT
 * @website: https://kokonutui.com
 */

import React, { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface InkLine {
  text: string;
  color?: string; // Hex color, e.g. #14090b or #7b1425
  fontWeight?: number | string; // e.g. 600 or 800
  fontStyle?: "normal" | "italic"; // e.g. "italic"
}

export interface InkBackgroundProps {
  /** Single headline string (for standard Kokonut UI usage) */
  text?: string;
  /** Multi-line headline with custom per-line colors and font weights/styles */
  lines?: InkLine[];
  /** Color of the ink a click drops (default: #7b1425 maroon) */
  accent?: string;
  /** Content under the headline */
  children?: ReactNode;
  /** Set false for a still backdrop / disabled interactions */
  interactive?: boolean;
  className?: string;
  /** Custom display font family. Defaults to Fraunces. */
  fontFamily?: string;
}

// Fluid simulation grid constants
const SIM = 128;
const DYE = 512;
const PRESSURE_ITERATIONS = 20;
// Ink dissipation and velocity damping
const DYE_FADE = 0.35;
const VELOCITY_FADE = 1.2;
const CURL = 24;
// Rate at which letters pull ink back once untouched
const GATHER = 0.08;
const GATHER_AFTER = 1000;
// Loop pauses after this long with no interaction to conserve resources
const SLEEP_AFTER = 4000;
const STIR_FORCE = 5400;
const STIR_RADIUS = 0.0024;
const DROP_RADIUS = 0.004;

const VERTEX = `#version 300 es
in vec2 aPos;
out vec2 vUv;
out vec2 vL;
out vec2 vR;
out vec2 vT;
out vec2 vB;
uniform vec2 texel;
void main() {
  vUv = aPos * 0.5 + 0.5;
  vL = vUv - vec2(texel.x, 0.0);
  vR = vUv + vec2(texel.x, 0.0);
  vT = vUv + vec2(0.0, texel.y);
  vB = vUv - vec2(0.0, texel.y);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const HEAD = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 o;
`;

const SHADERS = {
  splat: `${HEAD}
uniform sampler2D uTarget;
uniform float aspect;
uniform vec3 color;
uniform vec2 point;
uniform float radius;
void main() {
  vec2 p = vUv - point;
  p.x *= aspect;
  vec3 s = exp(-dot(p, p) / radius) * color;
  o = vec4(texture(uTarget, vUv).xyz + s, 1.0);
}`,
  advect: `${HEAD}
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 simTexel;
uniform float dt;
uniform float fade;
void main() {
  vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * simTexel;
  o = texture(uSource, coord) / (1.0 + fade * dt);
}`,
  divergence: `${HEAD}
uniform sampler2D uVelocity;
void main() {
  float l = texture(uVelocity, vL).x;
  float r = texture(uVelocity, vR).x;
  float t = texture(uVelocity, vT).y;
  float b = texture(uVelocity, vB).y;
  vec2 c = texture(uVelocity, vUv).xy;
  if (vL.x < 0.0) { l = -c.x; }
  if (vR.x > 1.0) { r = -c.x; }
  if (vT.y > 1.0) { t = -c.y; }
  if (vB.y < 0.0) { b = -c.y; }
  o = vec4(0.5 * (r - l + t - b), 0.0, 0.0, 1.0);
}`,
  curl: `${HEAD}
uniform sampler2D uVelocity;
void main() {
  float l = texture(uVelocity, vL).y;
  float r = texture(uVelocity, vR).y;
  float t = texture(uVelocity, vT).x;
  float b = texture(uVelocity, vB).x;
  o = vec4(0.5 * (r - l - t + b), 0.0, 0.0, 1.0);
}`,
  vorticity: `${HEAD}
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float curl;
uniform float dt;
void main() {
  float l = texture(uCurl, vL).x;
  float r = texture(uCurl, vR).x;
  float t = texture(uCurl, vT).x;
  float b = texture(uCurl, vB).x;
  float c = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(t) - abs(b), abs(r) - abs(l));
  force /= length(force) + 0.0001;
  force *= curl * c;
  force.y *= -1.0;
  vec2 v = texture(uVelocity, vUv).xy + force * dt;
  o = vec4(clamp(v, -1000.0, 1000.0), 0.0, 1.0);
}`,
  pressure: `${HEAD}
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main() {
  float l = texture(uPressure, vL).x;
  float r = texture(uPressure, vR).x;
  float t = texture(uPressure, vT).x;
  float b = texture(uPressure, vB).x;
  float d = texture(uDivergence, vUv).x;
  o = vec4((l + r + b + t - d) * 0.25, 0.0, 0.0, 1.0);
}`,
  gradient: `${HEAD}
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main() {
  float l = texture(uPressure, vL).x;
  float r = texture(uPressure, vR).x;
  float t = texture(uPressure, vT).x;
  float b = texture(uPressure, vB).x;
  vec2 v = texture(uVelocity, vUv).xy - vec2(r - l, t - b);
  o = vec4(v, 0.0, 1.0);
}`,
  scale: `${HEAD}
uniform sampler2D uTarget;
uniform float value;
void main() {
  o = value * texture(uTarget, vUv);
}`,
  gather: `${HEAD}
uniform sampler2D uDye;
uniform sampler2D uMask;
uniform float rate;
void main() {
  vec4 d = texture(uDye, vUv);
  vec4 m = texture(uMask, vUv);
  o = vec4(mix(d.r, m.r, rate), mix(d.g, m.g, rate), d.b, 1.0);
}`,
  display: `${HEAD}
uniform sampler2D uDye;
uniform vec3 ink1;
uniform vec3 ink2;
uniform vec3 accent;
void main() {
  vec4 d = texture(uDye, vUv);
  float a1 = smoothstep(0.015, 0.85, d.r);
  float a2 = smoothstep(0.015, 0.85, d.g);
  float a3 = smoothstep(0.015, 0.85, d.b);

  vec2 edge = smoothstep(vec2(0.0), vec2(0.06), vUv) * smoothstep(vec2(1.0), vec2(0.94), vUv);
  float edgeFade = edge.x * edge.y;

  vec3 col = ink1 * a1 + ink2 * a2 + accent * (a3 * 0.92);
  float alpha = clamp(a1 + a2 + a3 * 0.92, 0.0, 1.0);
  if (alpha > 0.001) {
    col /= alpha;
  }
  alpha *= edgeFade;

  o = vec4(col, alpha);
}`,
};

type ProgramName = keyof typeof SHADERS;

interface Target {
  tex: WebGLTexture;
  fbo: WebGLFramebuffer;
  w: number;
  h: number;
}

interface Double {
  read: Target;
  write: Target;
  swap: () => void;
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

interface Program {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

function link(gl: WebGL2RenderingContext, vertex: WebGLShader, source: string) {
  const fragment = compile(gl, gl.FRAGMENT_SHADER, source);
  const program = gl.createProgram();
  if (!(fragment && program)) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, "aPos");
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  const uniforms: Program["uniforms"] = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
}

function parseHex(hexStr: string, fallback: [number, number, number]): [number, number, number] {
  if (!hexStr) return fallback;
  const clean = hexStr.replace("#", "").trim();
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16) / 255,
      parseInt(clean[1] + clean[1], 16) / 255,
      parseInt(clean[2] + clean[2], 16) / 255,
    ];
  }
  if (clean.length === 6) {
    return [
      parseInt(clean.slice(0, 2), 16) / 255,
      parseInt(clean.slice(2, 4), 16) / 255,
      parseInt(clean.slice(4, 6), 16) / 255,
    ];
  }
  return fallback;
}

interface Fluid {
  resize: (w: number, h: number) => void;
  setMask: (source: HTMLCanvasElement) => void;
  initDyeFromMask: () => void;
  setColors: (ink1: number[], ink2: number[], accent: number[]) => void;
  splat: (
    x: number,
    y: number,
    vx: number,
    vy: number,
    ink: number[],
    radius: number
  ) => void;
  step: (dt: number, gather: number) => void;
  draw: () => void;
  destroy: () => void;
}

function createFluid(gl: WebGL2RenderingContext): Fluid | null {
  if (!gl.getExtension("EXT_color_buffer_float")) return null;
  gl.getExtension("OES_texture_float_linear");
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  if (!vertex) return null;
  const programs = {} as Record<ProgramName, Program>;
  for (const name of Object.keys(SHADERS) as ProgramName[]) {
    const made = link(gl, vertex, SHADERS[name]);
    if (!made) return null;
    programs[name] = made;
  }

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const textures: WebGLTexture[] = [];
  const framebuffers: WebGLFramebuffer[] = [];

  const target = (
    w: number,
    h: number,
    internal: number,
    format: number
  ): Target => {
    const tex = gl.createTexture() as WebGLTexture;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      internal,
      w,
      h,
      0,
      format,
      gl.HALF_FLOAT,
      null
    );
    const fbo = gl.createFramebuffer() as WebGLFramebuffer;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      tex,
      0
    );
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    textures.push(tex);
    framebuffers.push(fbo);
    return { tex, fbo, w, h };
  };

  const double = (
    w: number,
    h: number,
    internal: number,
    format: number
  ): Double => {
    const pair = {
      read: target(w, h, internal, format),
      write: target(w, h, internal, format),
      swap: () => {
        const t = pair.read;
        pair.read = pair.write;
        pair.write = t;
      },
    };
    return pair;
  };

  const free = () => {
    for (const t of textures) gl.deleteTexture(t);
    for (const f of framebuffers) gl.deleteFramebuffer(f);
    textures.length = 0;
    framebuffers.length = 0;
  };

  let aspect = 1;
  const sizeFor = (short: number) =>
    aspect >= 1
      ? [Math.round(short * aspect), short]
      : [short, Math.round(short / aspect)];

  const [initSw, initSh] = sizeFor(SIM);
  const [initDw, initDh] = sizeFor(DYE);
  let velocity: Double = double(initSw, initSh, gl.RG16F, gl.RG);
  let dye: Double = double(initDw, initDh, gl.RGBA16F, gl.RGBA);
  let pressure: Double = double(initSw, initSh, gl.R16F, gl.RED);
  let divergence: Target = target(initSw, initSh, gl.R16F, gl.RED);
  let curl: Target = target(initSw, initSh, gl.R16F, gl.RED);
  const mask = gl.createTexture() as WebGLTexture;
  gl.bindTexture(gl.TEXTURE_2D, mask);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 0, 0])
  );

  let unit = 0;
  const run = (name: ProgramName, texel: [number, number]) => {
    const p = programs[name];
    gl.useProgram(p.program);
    gl.uniform2f(p.uniforms.texel, texel[0], texel[1]);
    unit = 0;
    return p;
  };
  const bind = (p: Program, uniform: string, tex: WebGLTexture) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(p.uniforms[uniform], unit);
    unit++;
  };
  const blit = (out: Target | null, w?: number, h?: number) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, out ? out.fbo : null);
    gl.viewport(0, 0, out ? out.w : (w ?? 1), out ? out.h : (h ?? 1));
    if (!out) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  let ink1Color = [0.0784, 0.0353, 0.0431]; // #14090b
  let ink2Color = [0.4824, 0.0784, 0.1451]; // #7b1425
  let accentColor = [0.4824, 0.0784, 0.1451]; // #7b1425
  let canvasW = 1;
  let canvasH = 1;

  return {
    resize(w, h) {
      if (!w || !h || w < 2 || h < 2) return;
      canvasW = w;
      canvasH = h;
      aspect = w / h;
      free();
      const [sw, sh] = sizeFor(SIM);
      const [dw, dh] = sizeFor(DYE);
      velocity = double(sw, sh, gl.RG16F, gl.RG);
      pressure = double(sw, sh, gl.R16F, gl.RED);
      divergence = target(sw, sh, gl.R16F, gl.RED);
      curl = target(sw, sh, gl.R16F, gl.RED);
      dye = double(dw, dh, gl.RGBA16F, gl.RGBA);
    },
    setMask(source) {
      gl.bindTexture(gl.TEXTURE_2D, mask);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    },
    initDyeFromMask() {
      if (!dye?.read || !dye?.write) return;
      // Instantly copies the mask into the dye texture so headline letters are immediately filled
      const p = run("gather", [1 / dye.read.w, 1 / dye.read.h]);
      bind(p, "uDye", dye.read.tex);
      bind(p, "uMask", mask);
      gl.uniform1f(p.uniforms.rate, 1.0);
      blit(dye.write);
      dye.swap();
    },
    setColors(i1, i2, a) {
      ink1Color = i1;
      ink2Color = i2;
      accentColor = a;
    },
    splat(x, y, vx, vy, ink, radius) {
      if (!velocity?.read || !velocity?.write || !dye?.read || !dye?.write) return;
      const r = radius * (aspect > 1 ? aspect : 1);
      let p = run("splat", [1 / velocity.read.w, 1 / velocity.read.h]);
      bind(p, "uTarget", velocity.read.tex);
      gl.uniform1f(p.uniforms.aspect, aspect);
      gl.uniform2f(p.uniforms.point, x, y);
      gl.uniform3f(p.uniforms.color, vx, vy, 0);
      gl.uniform1f(p.uniforms.radius, r);
      blit(velocity.write);
      velocity.swap();
      if (ink[0] || ink[1] || ink[2]) {
        p = run("splat", [1 / dye.read.w, 1 / dye.read.h]);
        bind(p, "uTarget", dye.read.tex);
        gl.uniform1f(p.uniforms.aspect, aspect);
        gl.uniform2f(p.uniforms.point, x, y);
        gl.uniform3f(p.uniforms.color, ink[0], ink[1], ink[2]);
        gl.uniform1f(p.uniforms.radius, r);
        blit(dye.write);
        dye.swap();
      }
    },
    step(dt, gather) {
      if (
        !velocity?.read ||
        !velocity?.write ||
        !dye?.read ||
        !dye?.write ||
        !pressure?.read ||
        !pressure?.write ||
        !curl ||
        !divergence
      ) {
        return;
      }
      const sim: [number, number] = [1 / velocity.read.w, 1 / velocity.read.h];
      let p = run("curl", sim);
      bind(p, "uVelocity", velocity.read.tex);
      blit(curl);

      p = run("vorticity", sim);
      bind(p, "uVelocity", velocity.read.tex);
      bind(p, "uCurl", curl.tex);
      gl.uniform1f(p.uniforms.curl, CURL);
      gl.uniform1f(p.uniforms.dt, dt);
      blit(velocity.write);
      velocity.swap();

      p = run("divergence", sim);
      bind(p, "uVelocity", velocity.read.tex);
      blit(divergence);

      p = run("scale", sim);
      bind(p, "uTarget", pressure.read.tex);
      gl.uniform1f(p.uniforms.value, 0.8);
      blit(pressure.write);
      pressure.swap();

      for (let i = 0; i < PRESSURE_ITERATIONS; i++) {
        p = run("pressure", sim);
        bind(p, "uPressure", pressure.read.tex);
        bind(p, "uDivergence", divergence.tex);
        blit(pressure.write);
        pressure.swap();
      }

      p = run("gradient", sim);
      bind(p, "uPressure", pressure.read.tex);
      bind(p, "uVelocity", velocity.read.tex);
      blit(velocity.write);
      velocity.swap();

      p = run("advect", sim);
      bind(p, "uVelocity", velocity.read.tex);
      bind(p, "uSource", velocity.read.tex);
      gl.uniform2f(p.uniforms.simTexel, sim[0], sim[1]);
      gl.uniform1f(p.uniforms.dt, dt);
      gl.uniform1f(p.uniforms.fade, VELOCITY_FADE);
      blit(velocity.write);
      velocity.swap();

      p = run("advect", [1 / dye.read.w, 1 / dye.read.h]);
      bind(p, "uVelocity", velocity.read.tex);
      bind(p, "uSource", dye.read.tex);
      gl.uniform2f(p.uniforms.simTexel, sim[0], sim[1]);
      gl.uniform1f(p.uniforms.dt, dt);
      gl.uniform1f(p.uniforms.fade, DYE_FADE);
      blit(dye.write);
      dye.swap();

      if (gather > 0) {
        p = run("scale", sim);
        bind(p, "uTarget", velocity.read.tex);
        gl.uniform1f(p.uniforms.value, Math.max(0.0, 1 - gather * 1.5));
        blit(velocity.write);
        velocity.swap();

        p = run("gather", [1 / dye.read.w, 1 / dye.read.h]);
        bind(p, "uDye", dye.read.tex);
        bind(p, "uMask", mask);
        gl.uniform1f(p.uniforms.rate, gather);
        blit(dye.write);
        dye.swap();
      }
    },
    draw() {
      if (!dye?.read) return;
      const p = run("display", [1 / dye.read.w, 1 / dye.read.h]);
      bind(p, "uDye", dye.read.tex);
      gl.uniform3fv(p.uniforms.ink1, ink1Color);
      gl.uniform3fv(p.uniforms.ink2, ink2Color);
      gl.uniform3fv(p.uniforms.accent, accentColor);
      blit(null, canvasW, canvasH);
    },
    destroy() {
      free();
      gl.deleteTexture(mask);
      gl.deleteBuffer(quad);
      for (const p of Object.values(programs)) gl.deleteProgram(p.program);
      gl.deleteShader(vertex);
    },
  };
}

export default function InkBackground({
  text,
  lines,
  accent = "#7b1425",
  children,
  interactive = true,
  className,
  fontFamily = '"Fraunces", Georgia, serif',
}: InkBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [ready, setReady] = useState(false);
  const [padX, setPadX] = useState(70);
  const [padY, setPadY] = useState(55);

  const effectiveLines: InkLine[] = lines && lines.length > 0
    ? lines
    : [
        { text: text || "Turn your store data into", color: "#14090b", fontWeight: 600 },
        { text: "smarter business decisions.", color: "#7b1425", fontWeight: 800, fontStyle: "italic" },
      ];

  const line1ColorHex = effectiveLines[0]?.color || "#14090b";
  const line2ColorHex = effectiveLines[1]?.color || "#7b1425";

  useEffect(() => {
    let canceled = false;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const line1El = line1Ref.current;
    const line2El = line2Ref.current;

    if (!container || !canvas || !line1El) return;

    // Check prefers-reduced-motion
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      depth: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) return;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const fluid = createFluid(gl);
    if (!fluid) return;

    fluid.setColors(
      parseHex(line1ColorHex, [0.0784, 0.0353, 0.0431]),
      parseHex(line2ColorHex, [0.4824, 0.0784, 0.1451]),
      parseHex(accent, [0.4824, 0.0784, 0.1451])
    );

    const maskCanvas = document.createElement("canvas");

    let isBuilt = false;
    let width = 0;
    let height = 0;
    let raf = 0;
    let last = 0;
    let visible = true;
    let touched = -Number.POSITIVE_INFINITY;
    let active = performance.now();
    const hand = { x: 0, y: 0, on: false, down: false, moved: 0 };

    const build = async () => {
      if (document.fonts) {
        await document.fonts.ready;
      }
      if (canceled) return;

      const cRect = container.getBoundingClientRect();
      const l1Rect = line1El.getBoundingClientRect();
      const l2Rect = line2El?.getBoundingClientRect();

      if (cRect.width < 2 || cRect.height < 2) return;

      const isMobile = window.innerWidth < 768;
      const currentPadX = isMobile ? 18 : 70;
      const currentPadY = isMobile ? 24 : 55;
      setPadX(currentPadX);
      setPadY(currentPadY);

      width = Math.round(cRect.width + currentPadX * 2);
      height = Math.round(cRect.height + currentPadY * 2);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      fluid.resize(canvas.width, canvas.height);

      // Draw mask in offscreen canvas
      const scale = DYE / Math.min(width, height);
      maskCanvas.width = Math.round(width * scale);
      maskCanvas.height = Math.round(height * scale);
      const ctx = maskCanvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, width, height);

      const style1 = getComputedStyle(line1El);
      const fontSize1 = parseFloat(style1.fontSize) || 60;
      const x1 = l1Rect.left - cRect.left + currentPadX + l1Rect.width / 2;
      const y1 = l1Rect.top - cRect.top + currentPadY + l1Rect.height / 2;

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.filter = `blur(${Math.max(0.8, fontSize1 * 0.012)}px)`;

      // Line 1: Red channel in mask texture
      ctx.letterSpacing = style1.letterSpacing || "-0.03em";
      ctx.font = `${effectiveLines[0].fontWeight || 600} ${fontSize1}px ${fontFamily}`;
      ctx.fillStyle = "rgb(255, 0, 0)";
      ctx.fillText(effectiveLines[0].text, x1, y1);

      // Line 2: Green channel in mask texture
      if (line2El && l2Rect && effectiveLines[1]?.text) {
        const style2 = getComputedStyle(line2El);
        const fontSize2 = parseFloat(style2.fontSize) || fontSize1;
        const x2 = l2Rect.left - cRect.left + currentPadX + l2Rect.width / 2;
        const y2 = l2Rect.top - cRect.top + currentPadY + l2Rect.height / 2;

        ctx.letterSpacing = style2.letterSpacing || "-0.03em";
        ctx.font = `${effectiveLines[1].fontStyle || "italic"} ${effectiveLines[1].fontWeight || 800} ${fontSize2}px ${fontFamily}`;
        ctx.fillStyle = "rgb(0, 255, 0)";
        ctx.fillText(effectiveLines[1].text, x2, y2);
      }

      fluid.setMask(maskCanvas);
      // Immediately initialize the dye texture to match the mask
      fluid.initDyeFromMask();
      fluid.draw();

      if (!canceled) {
        isBuilt = true;
        setReady(true);
        start();
      }
    };

    const frame = (now: number) => {
      raf = 0;
      if (!visible || !isBuilt) return;
      const dt = Math.min((now - (last || now - 16)) / 1000, 1 / 30);
      last = now;
      if (hand.down || hand.moved > now - 100) {
        active = now;
      }
      const idle = now - touched;
      let gather = 0;
      if (idle > GATHER_AFTER) {
        gather = GATHER * Math.min(1, (idle - GATHER_AFTER) / 1200);
      }
      fluid.step(dt, gather);
      fluid.draw();
      if (now - active < SLEEP_AFTER) {
        raf = requestAnimationFrame(frame);
      }
    };

    const start = () => {
      if (!raf && visible && isBuilt && !reduceMotion) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    };

    build();

    const resizeObserver = new ResizeObserver(() => {
      build();
      active = performance.now();
      touched = -Number.POSITIVE_INFINITY;
      start();
    });
    resizeObserver.observe(container);

    let onScreen = true;
    const intersection = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      visible = onScreen && document.visibilityState === "visible";
      start();
    });
    intersection.observe(container);

    const onVisibility = () => {
      visible = onScreen && document.visibilityState === "visible";
      start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const local = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) / rect.width,
        y: 1 - (event.clientY - rect.top) / rect.height,
      };
    };

    const onMove = (event: PointerEvent) => {
      if (!isBuilt) return;
      const p = local(event);
      if (hand.on) {
        const dx = p.x - hand.x;
        const dy = p.y - hand.y;
        if (dx || dy) {
          fluid.splat(
            p.x,
            p.y,
            dx * STIR_FORCE,
            dy * STIR_FORCE,
            hand.down ? [0, 0.06, 0] : [0, 0, 0],
            STIR_RADIUS
          );
          touched = performance.now();
          hand.moved = touched;
        }
      }
      hand.x = p.x;
      hand.y = p.y;
      hand.on = true;
      start();
    };

    const onLeave = () => {
      hand.on = false;
      hand.down = false;
    };

    const onDown = (event: PointerEvent) => {
      if (!isBuilt) return;
      if ((event.target as HTMLElement).closest("a, button, input, textarea")) {
        return;
      }
      const p = local(event);
      hand.down = true;
      hand.on = true;
      hand.x = p.x;
      hand.y = p.y;
      // Click drops extra maroon ink
      fluid.splat(p.x, p.y, 0, 0, [0, 0, 0.65], DROP_RADIUS);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const r = 0.012;
        fluid.splat(
          p.x + Math.cos(a) * r * (height / width),
          p.y + Math.sin(a) * r,
          Math.cos(a) * 420,
          Math.sin(a) * 420,
          [0, 0, 0],
          STIR_RADIUS * 0.6
        );
      }
      touched = performance.now();
      active = touched;
      start();
    };

    const onUp = () => {
      hand.down = false;
    };

    if (interactive && !reduceMotion) {
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerleave", onLeave);
      canvas.addEventListener("pointerdown", onDown);
      canvas.addEventListener("pointerup", onUp);
      canvas.addEventListener("pointercancel", onUp);
    }

    return () => {
      canceled = true;
      isBuilt = false;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      fluid.destroy();
    };
  }, [effectiveLines[0]?.text, effectiveLines[1]?.text, line1ColorHex, line2ColorHex, accent, interactive, fontFamily]);

  const displayStyle: React.CSSProperties = {
    fontFamily,
    fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144',
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative mx-auto flex justify-center text-center", className)}
    >
      {/* Real accessible <h1> for SEO & initial static display */}
      <h1
        ref={headingRef}
        style={displayStyle}
        className={cn(
          "text-[2.6rem] sm:text-6xl lg:text-[5.4rem] font-semibold tracking-[-0.03em] leading-[1.02]",
          ready ? "opacity-0 select-none" : "opacity-100"
        )}
      >
        <span ref={line1Ref} className="block text-[#14090b]">
          {effectiveLines[0].text}
        </span>
        {effectiveLines[1]?.text && (
          <span
            ref={line2Ref}
            className="block italic font-extrabold text-[#7b1425]"
          >
            {effectiveLines[1].text}
          </span>
        )}
      </h1>

      {/* The interactive WebGL ink canvas */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={cn(
          "pointer-events-auto touch-pan-y absolute transition-opacity duration-300",
          ready ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        style={{
          left: `-${padX}px`,
          top: `-${padY}px`,
          width: `calc(100% + ${padX * 2}px)`,
          height: `calc(100% + ${padY * 2}px)`,
        }}
      />

      {children && <div className="relative z-10 w-full">{children}</div>}
    </div>
  );
}

export { InkBackground as InkHeadline };
