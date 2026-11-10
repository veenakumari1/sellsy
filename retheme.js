const fs = require("fs");
const path = require("path");

const DIRS = ["app", "components", "src"];
const EXT = [".tsx", ".ts", ".jsx", ".js", ".css"];

const wine = {
  50: "#FBF1F3", 100: "#F6E1E5", 200: "#EBC3CB", 300: "#DC9AA7", 400: "#C26679",
  500: "#A3243A", 600: "#7b1425", 700: "#620F1E", 800: "#4D0C18", 900: "#380911",
};
const warm = {
  50: "#faf8f5", 100: "#f3ede7", 200: "#e8e2dc", 300: "#d4c9c2", 400: "#a89b99",
  500: "#6f6264", 600: "#5a4e50", 700: "#3b2f31", 800: "#2a1b1e", 900: "#14090b",
};

const PREFIX =
  "(?:bg|text|border(?:-[trblxyse])?|ring|ring-offset|fill|stroke|from|to|via|outline|divide|shadow|accent|caret|decoration|placeholder)";

const colorRe = new RegExp(
  `(?<![\\w-])(${PREFIX})-(blue|indigo|sky|slate|gray)-(\\d{2,3})(\\/\\d+)?`,
  "g"
);

const hexMap = {
  "#2563EB": "#7b1425", "#3B82F6": "#a3243a", "#1D4ED8": "#620F1E",
  "#60A5FA": "#C26679", "#EFF6FF": "#FBF1F3", "#DBEAFE": "#F6E1E5",
};

function transform(src) {
  let out = src.replace(colorRe, (m, prefix, color, shade, opacity = "") => {
    const table = ["slate", "gray"].includes(color) ? warm : wine;
    const hex = table[shade];
    return hex ? `${prefix}-[${hex}]${opacity}` : m;
  });
  for (const [from, to] of Object.entries(hexMap)) {
    out = out.replace(new RegExp(from, "gi"), to);
  }
  return out;
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    if (f === "node_modules" || f === ".next") continue;
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (EXT.includes(path.extname(p))) {
      const src = fs.readFileSync(p, "utf8");
      const out = transform(src);
      if (out !== src) {
        fs.writeFileSync(p, out);
        console.log("updated:", p);
      }
    }
  }
}

DIRS.forEach(walk);
console.log("done");