import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { extractFile } from "@electron/asar";
import * as ResEdit from "resedit";

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [sourceArg, outputArg] = process.argv.slice(2);
if (!sourceArg || !outputArg) {
  throw new Error('用法：node scripts/build-from-install.mjs "原版安装目录" "新的输出目录"');
}
const sourceDir = fs.realpathSync(path.resolve(sourceArg));
const outputDir = path.resolve(outputArg);
if (fs.existsSync(outputDir)) throw new Error("输出目录已存在，请指定一个新的目录。");
if (outputDir.toLowerCase().startsWith((sourceDir + path.sep).toLowerCase())) {
  throw new Error("输出目录不能位于原版安装目录内。");
}

const sourceExe = path.join(sourceDir, "Clash Party.exe");
const sourceAsar = path.join(sourceDir, "resources", "app.asar");
const png = fs.readFileSync(path.join(projectDir, "assets", "logo-white-512.png"));
const svg = fs.readFileSync(path.join(projectDir, "assets", "logo-white.svg"));
const ico = ResEdit.Data.IconFile.from(
  fs.readFileSync(path.join(projectDir, "assets", "logo-white-windows.ico")),
);
const hash = (data) => crypto.createHash("sha256").update(data).digest("hex");
if (png.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a" ||
    png.readUInt32BE(16) !== 512 || png.readUInt32BE(20) !== 512) {
  throw new Error("主图标 PNG 必须是 512×512。");
}
if (ico.icons.length < 4) throw new Error("ICO 缺少多尺寸图层。");

// This app version can only be patched without updating the EXE's embedded
// ASAR header hash when Electron's ASAR integrity fuse is disabled.
const fuseCli = path.join(projectDir, "node_modules", "@electron", "fuses", "dist", "bin.js");
const fuseState = execFileSync(process.execPath, [fuseCli, "read", "--app", sourceExe], {
  encoding: "utf8",
});
if (!fuseState.includes("EnableEmbeddedAsarIntegrityValidation is Disabled")) {
  throw new Error("ASAR 完整性开关不再是 Disabled；停止并检查新版打包机制。");
}

const originalExe = fs.readFileSync(sourceExe);
const exe = ResEdit.NtExecutable.from(originalExe);
const resources = ResEdit.NtExecutableResource.from(exe);
const groups = ResEdit.Resource.IconGroupEntry.fromEntries(resources.entries);
if (groups.length !== 1) throw new Error("EXE 图标组数量已变化，请人工检查新版。");
const nonIcon = (entries) => new Map(entries
  .filter((entry) => Number(entry.type) !== 3 && Number(entry.type) !== 14)
  .map((entry) => [
    `${entry.type}|${entry.id}|${entry.lang}`,
    hash(Buffer.from(entry.bin)),
  ]));
const originalOtherResources = nonIcon(resources.entries);
ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
  resources.entries, groups[0].id, groups[0].lang, ico.icons.map((item) => item.data),
);
resources.outputResource(exe);
const modifiedExe = Buffer.from(exe.generate());
const changedOtherResources = nonIcon(
  ResEdit.NtExecutableResource.from(ResEdit.NtExecutable.from(modifiedExe)).entries,
);
if (originalOtherResources.size !== changedOtherResources.size ||
    [...originalOtherResources].some(([key, value]) => changedOtherResources.get(key) !== value)) {
  throw new Error("EXE 的非图标资源发生变化，停止构建。");
}

const originalAsar = fs.readFileSync(sourceAsar);
const headerLength = originalAsar.readUInt32LE(12);
const header = JSON.parse(originalAsar.subarray(16, 16 + headerLength).toString("utf8"));
const body = originalAsar.subarray(8 + originalAsar.readUInt32LE(4));
function entryFor(name) {
  let entry = header;
  for (const segment of name.split("/")) entry = entry.files?.[segment];
  if (!entry || entry.files || entry.unpacked) throw new Error(`找不到打包文件：${name}`);
  return entry;
}
function readPacked(name) {
  const entry = entryFor(name);
  return body.subarray(Number(entry.offset), Number(entry.offset) + entry.size);
}
const assetEntries = header.files?.out?.files?.renderer?.files?.assets?.files;
if (!assetEntries) throw new Error("新版前端资源目录已变化。");
function findBundle(prefix, needle) {
  const hits = Object.keys(assetEntries)
    .filter((name) => name.startsWith(prefix) && name.endsWith(".js"))
    .filter((name) => readPacked(`out/renderer/assets/${name}`).toString("utf8").includes(needle));
  if (hits.length !== 1) throw new Error(`${prefix} 脚本定位失败，匹配数：${hits.length}`);
  return `out/renderer/assets/${hits[0]}`;
}
const oldLogo = 'jsxRuntimeExports.jsx(MihomoIcon, { className: "h-8 leading-8 text-lg mx-px" })';
const indexName = findBundle("index-", oldLogo);
const index = readPacked(indexName).toString("utf8");
if (index.split(oldLogo).length - 1 !== 2) throw new Error("主窗口图标位置已变化。");
const logoDataUrl = `data:image/svg+xml;base64,${svg.toString("base64")}`;
const newLogo = 'jsxRuntimeExports.jsx("img", { src: ' + JSON.stringify(logoDataUrl) +
  ', className: "h-8 leading-8 text-lg mx-px", alt: "Clash Party", draggable: false })';
const modifiedIndex = Buffer.from(index.replaceAll(oldLogo, newLogo), "utf8");

const cacheDeclaration = 'const ICON_CACHE_INDEX_KEY = "icon_cache_index";';
const connectionsName = findBundle("connections-", cacheDeclaration);
const connections = readPacked(connectionsName).toString("utf8");
if (connections.split(cacheDeclaration).length !== 2 ||
    !connections.includes("function getIconFromCache(path)")) {
  throw new Error("连接页图标缓存逻辑已变化。");
}
const cacheRevision = `clash_party_exe_icon_${hash(originalExe).slice(0, 16)}`;
const cachePatch = `
const CLASH_PARTY_ICON_CACHE_REVISION_KEY = ${JSON.stringify(cacheRevision)};
try {
  if (localStorage.getItem(CLASH_PARTY_ICON_CACHE_REVISION_KEY) !== "1") {
    const stale = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(ICON_CACHE_KEY_PREFIX) && /clash party\\.exe$/i.test(key.slice(ICON_CACHE_KEY_PREFIX.length))) stale.push(key);
    }
    for (const key of stale) localStorage.removeItem(key);
    const rawIndex = localStorage.getItem(ICON_CACHE_INDEX_KEY);
    if (rawIndex) {
      try {
        const index = JSON.parse(rawIndex);
        if (Array.isArray(index)) localStorage.setItem(ICON_CACHE_INDEX_KEY, JSON.stringify(index.filter((p) => !/clash party\\.exe$/i.test(p))));
      } catch {}
    }
    localStorage.setItem(CLASH_PARTY_ICON_CACHE_REVISION_KEY, "1");
  }
} catch {}
`;
const modifiedConnections = Buffer.from(connections.replace(cacheDeclaration, cacheDeclaration + cachePatch), "utf8");

let nextOffset = body.length;
function replacePacked(name, data) {
  const entry = entryFor(name);
  const blockSize = entry.integrity?.blockSize || 4194304;
  const blocks = [];
  for (let i = 0; i < data.length; i += blockSize) blocks.push(hash(data.subarray(i, i + blockSize)));
  entry.offset = String(nextOffset);
  entry.size = data.length;
  entry.integrity = { algorithm: "SHA256", hash: hash(data), blockSize, blocks };
  nextOffset += data.length;
}
replacePacked("resources/icon.png", png);
replacePacked(indexName, modifiedIndex);
replacePacked(connectionsName, modifiedConnections);
const json = Buffer.from(JSON.stringify(header), "utf8");
const innerSize = 4 + Math.ceil((json.length + 1) / 4) * 4;
const outerSize = 4 + innerSize;
const prefix = Buffer.alloc(8 + outerSize);
prefix.writeUInt32LE(4, 0);
prefix.writeUInt32LE(outerSize, 4);
prefix.writeUInt32LE(innerSize, 8);
prefix.writeUInt32LE(json.length, 12);
json.copy(prefix, 16);
const modifiedAsar = Buffer.concat([prefix, body, png, modifiedIndex, modifiedConnections]);

fs.cpSync(sourceDir, outputDir, { recursive: true, force: false, errorOnExist: true });
const outputExe = path.join(outputDir, "Clash Party.exe");
const outputAsar = path.join(outputDir, "resources", "app.asar");
fs.writeFileSync(outputExe, modifiedExe);
fs.writeFileSync(outputAsar, modifiedAsar);
for (const [name, expected] of [
  ["resources/icon.png", png],
  [indexName, modifiedIndex],
  [connectionsName, modifiedConnections],
]) {
  const actual = extractFile(outputAsar, name.replaceAll("/", path.sep));
  if (!actual.equals(expected)) throw new Error(`ASAR 读取校验失败：${name}`);
}
const version = JSON.parse(readPacked("package.json").toString("utf8")).version;
const manifest = {
  upstreamVersion: version,
  builtAtUtc: new Date().toISOString(),
  sourceExeSha256: hash(originalExe),
  modifiedExeSha256: hash(modifiedExe),
  sourceAsarSha256: hash(originalAsar),
  modifiedAsarSha256: hash(modifiedAsar),
  sourceSvgSha256: hash(svg),
  sourcePngSha256: hash(png),
  indexBundle: indexName,
  connectionsBundle: connectionsName,
  cacheRevision,
};
fs.writeFileSync(path.join(outputDir, "ICON-CUSTOMIZATION-MANIFEST.json"),
  JSON.stringify(manifest, null, 2) + "\n");
process.stdout.write(JSON.stringify({ outputDir, manifest }, null, 2) + "\n");
