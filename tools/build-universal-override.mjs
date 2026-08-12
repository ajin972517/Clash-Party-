import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoDir = path.dirname(toolDir);
const sourcePath = path.join(repoDir, "overrides", "BoostNet.yaml");
const outputPath = path.join(repoDir, "overrides", "通用3合1覆写.js");

const source = fs.readFileSync(sourcePath, "utf8");
const rulesMatch = source.match(/(?:^|\r?\n)rules:\r?\n/);

if (!rulesMatch || rulesMatch.index === undefined) {
  throw new Error("BoostNet.yaml 中没有找到 rules 段。");
}

const rules = source
  .slice(rulesMatch.index + rulesMatch[0].length)
  .split(/\r?\n/)
  .map((line) => line.match(/^\s*-\s+(.*)$/)?.[1])
  .filter(Boolean)
  .map((rule) => rule.replaceAll("B｜", "通用｜"));

if (!rules.length || !rules.some((rule) => rule.startsWith("MATCH,"))) {
  throw new Error("没有提取到完整的分流规则。");
}

const template = String.raw`// Clash Party 通用 JavaScript 覆写（三合一）
// 功能：保留真实订阅节点、移除订阅信息节点、重建策略组和分流规则、启用 TCP 保活。
// 规则来源：同仓库 BoostNet.yaml；节点列表会根据当前订阅动态生成。

function main(config) {
  const GROUP = "通用｜";
  const MAIN = GROUP + "🚀 节点选择";
  const AUTO = GROUP + "♻️ 自动选择";

  const excludedNamePatterns = [
    /套餐到期/i,
    /套餐重置/i,
    /订阅获取时间/i,
  ];

  const shouldExclude = (name) =>
    typeof name === "string" &&
    excludedNamePatterns.some((pattern) => pattern.test(name));

  const proxies = Array.isArray(config.proxies) ? config.proxies : [];
  config.proxies = proxies.filter(
    (proxy) => proxy && typeof proxy.name === "string" && !shouldExclude(proxy.name),
  );

  const nodeNames = config.proxies.map((proxy) => proxy.name);
  const unique = (items) => [...new Set(items.filter(Boolean))];
  const nodesMatching = (pattern) =>
    nodeNames.filter((name) => pattern.test(name));
  const withDirect = (nodes) => unique([...nodes, "DIRECT"]);

  const hongKong = nodesMatching(/(?:香港|港|hong\s*kong|\bhk\b|🇭🇰)/i);
  const taiwan = nodesMatching(/(?:台湾|台灣|taiwan|\btw\b|🇹🇼)/i);
  const japan = nodesMatching(/(?:日本|东京|東京|大阪|japan|tokyo|osaka|\bjp\b|🇯🇵)/i);
  const singapore = nodesMatching(/(?:新加坡|狮城|獅城|singapore|\bsg\b|🇸🇬)/i);
  const unitedStates = nodesMatching(/(?:美国|美國|洛杉矶|洛杉磯|西雅图|西雅圖|达拉斯|達拉斯|united\s*states|america|\busa?\b|🇺🇸)/i);

  const allNodes = nodeNames.length ? nodeNames : ["DIRECT"];
  const regionGroups = [
    { name: GROUP + "🇭🇰 香港节点", type: "select", proxies: withDirect(hongKong) },
    { name: GROUP + "🇹🇼 台湾节点", type: "select", proxies: withDirect(taiwan) },
    { name: GROUP + "🇯🇵 日本节点", type: "select", proxies: withDirect(japan) },
    { name: GROUP + "🇸🇬 新加坡节点", type: "select", proxies: withDirect(singapore) },
    { name: GROUP + "🇺🇸 美国节点", type: "select", proxies: withDirect(unitedStates) },
  ];

  const regionalChoices = regionGroups.map((group) => group.name);
  const commonChoices = unique(["DIRECT", MAIN, ...regionalChoices]);
  const proxyFirstChoices = unique([MAIN, ...regionalChoices, "DIRECT"]);
  const japanFirstChoices = unique([GROUP + "🇯🇵 日本节点", MAIN, "DIRECT"]);
  const usFirstChoices = unique([GROUP + "🇺🇸 美国节点", MAIN, "DIRECT"]);
  const selectGroup = (name, choices = commonChoices) => ({
    name: GROUP + name,
    type: "select",
    proxies: unique(choices),
  });

  config["proxy-groups"] = [
    {
      name: AUTO,
      type: "url-test",
      proxies: allNodes,
      url: "https://www.gstatic.com/generate_204",
      interval: 300,
      tolerance: 50,
    },
    ...regionGroups,
    {
      name: MAIN,
      type: "select",
      proxies: unique([AUTO, ...regionalChoices, ...allNodes, "DIRECT"]),
    },
    selectGroup("🌐 Google服务"),
    selectGroup("💬 Ai平台"),
    selectGroup("🟧 Adobe服务"),
    selectGroup("📟 NVIDIA"),
    selectGroup("💳 支付方式"),
    selectGroup("📱 Ultra Mobile", usFirstChoices),
    selectGroup("🇯🇵 日本服务", japanFirstChoices),
    selectGroup("📲 电报消息", proxyFirstChoices),
    selectGroup("📹 油管视频", proxyFirstChoices),
    selectGroup("🎥 奈飞视频", proxyFirstChoices),
    selectGroup("🎥 迪士尼+", proxyFirstChoices),
    selectGroup("📺 巴哈姆特", unique([GROUP + "🇹🇼 台湾节点", MAIN, "DIRECT"])),
    selectGroup("📺 哔哩哔哩"),
    selectGroup("📢 谷歌FCM"),
    selectGroup("Ⓜ️ 微软云盘"),
    selectGroup("Ⓜ️ 微软服务"),
    selectGroup("🍎 苹果服务"),
    selectGroup("🎮 游戏平台"),
    selectGroup("🎶 网易音乐"),
    selectGroup("🛑 广告拦截", ["REJECT", "DIRECT"]),
    selectGroup("🍃 应用净化", ["REJECT", "DIRECT"]),
    selectGroup("☁️ CloudFlare"),
    selectGroup("🤖 ChatGPT", usFirstChoices),
    selectGroup("📹 TikTok", proxyFirstChoices),
    selectGroup("🤖 Claude", usFirstChoices),
    selectGroup("📺 HBO系列", usFirstChoices),
    selectGroup("🎥 亚马逊视频", proxyFirstChoices),
    selectGroup("🤖 Gemini", usFirstChoices),
    selectGroup("📺 Hulu", usFirstChoices),
    selectGroup("📹 DAZN", proxyFirstChoices),
    selectGroup("🎮 Steam下载", ["DIRECT", MAIN]),
    selectGroup("🎮 Steam网页"),
    selectGroup("🤖 Copilot"),
    selectGroup("🎯 全球直连", ["DIRECT", MAIN]),
    selectGroup("🐟 漏网之鱼", [MAIN, "DIRECT"]),
  ];

  config.rules = __RULES__;
  config["keep-alive-idle"] = 60;
  config["keep-alive-interval"] = 30;
  config["disable-keep-alive"] = false;

  return config;
}
`;

const output = template.replace("__RULES__", JSON.stringify(rules, null, 2));
fs.writeFileSync(outputPath, output, "utf8");
console.log(`Generated ${path.basename(outputPath)} with ${rules.length} rules.`);
