/**
 * WgetCloud 专用 Clash Party JavaScript 覆写
 *
 * 功能：
 * 1. 开启 Mihomo TCP keep-alive，降低 ChatGPT/Codex 及其他 AI 长连接空闲断开概率。
 * 2. 将常用 AI 服务的连接入口置于订阅原规则之前，并沿用 WgetCloud 现有策略组。
 * 3. 删除“套餐到期、套餐重置、订阅获取时间”三类伪代理节点及其在所有代理组中的引用。
 *
 * 仅将此覆写绑定到 WgetCloud 订阅。脚本还会检查 WgetCloud 的策略组特征；
 * 若被误绑到其他订阅，将保持原配置不变。
 */

function main(config) {
  if (!config || typeof config !== "object") return config;

  const groups = Array.isArray(config["proxy-groups"])
    ? config["proxy-groups"]
    : [];

  const groupNames = new Set(
    groups
      .map((group) => group && group.name)
      .filter((name) => typeof name === "string"),
  );

  // 这些组同时存在是当前 WgetCloud 配置的防误用特征。
  const wgetCloudSignature = [
    "🚀 节点选择",
    "💬 Ai平台",
    "🤖 ChatGPT",
    "🤖 Claude",
    "🤖 Gemini",
    "🤖 Copilot",
    "📱 Ultra Mobile",
    "🐟 漏网之鱼",
  ];

  if (!wgetCloudSignature.every((name) => groupNames.has(name))) {
    console.log(
      "[WgetCloud AI keep-alive] 已跳过：当前订阅不符合 WgetCloud 策略组特征。",
    );
    return config;
  }

  const isSubscriptionInfoNode = (name) =>
    typeof name === "string" &&
    /套餐到期(?:日期)?|套餐重置(?:日期)?|订阅获取时间/i.test(name);

  // 删除伪装成代理的订阅信息节点。
  if (Array.isArray(config.proxies)) {
    config.proxies = config.proxies.filter(
      (proxy) => !isSubscriptionInfoNode(proxy && proxy.name),
    );
  }

  // 从每一个代理组中删除上述节点引用；不改变其他节点及策略组顺序。
  for (const group of groups) {
    if (group && Array.isArray(group.proxies)) {
      group.proxies = group.proxies.filter(
        (name) => !isSubscriptionInfoNode(name),
      );
    }
  }

  // Mihomo TCP keep-alive：作用于长连接传输，不改变策略组的节点选择。
  config["keep-alive-interval"] = 15;
  config["keep-alive-idle"] = 15;
  config["disable-keep-alive"] = false;

  // 放在机场原规则之前，避免 AI 长连接被较宽泛的规则提前接走。
  const aiConnectionRules = [
    // OpenAI / ChatGPT / Codex
    "DOMAIN,ws.chatgpt.com,🤖 ChatGPT",
    "DOMAIN,api.openai.com,🤖 ChatGPT",
    "DOMAIN-SUFFIX,chatgpt.livekit.cloud,🤖 ChatGPT",
    "DOMAIN-SUFFIX,host.livekit.cloud,🤖 ChatGPT",
    "DOMAIN-SUFFIX,turn.livekit.cloud,🤖 ChatGPT",

    // Anthropic Claude
    "DOMAIN,api.anthropic.com,🤖 Claude",
    "DOMAIN-SUFFIX,claude.ai,🤖 Claude",
    "DOMAIN-SUFFIX,claude.com,🤖 Claude",

    // Google Gemini
    "DOMAIN,generativelanguage.googleapis.com,🤖 Gemini",
    "DOMAIN,gemini.google.com,🤖 Gemini",
    "DOMAIN,ai.google.dev,🤖 Gemini",

    // Microsoft Copilot
    "DOMAIN,copilot.microsoft.com,🤖 Copilot",
    "DOMAIN,sydney.bing.com,🤖 Copilot",
    "DOMAIN,www.bingapis.com,🤖 Copilot",

    // 其他常用 AI 智能体与编程助手
    "DOMAIN-SUFFIX,perplexity.ai,💬 Ai平台",
    "DOMAIN-SUFFIX,poe.com,💬 Ai平台",
    "DOMAIN-SUFFIX,cursor.com,💬 Ai平台",
    "DOMAIN-SUFFIX,cursor.sh,💬 Ai平台",
    "DOMAIN-SUFFIX,windsurf.com,💬 Ai平台",
    "DOMAIN-SUFFIX,codeium.com,💬 Ai平台",
    "DOMAIN,api.x.ai,𝕏 推特",
    "DOMAIN-SUFFIX,grok.com,𝕏 推特",
  ];

  const originalRules = Array.isArray(config.rules) ? config.rules : [];
  const existingRules = new Set(
    originalRules.filter((rule) => typeof rule === "string"),
  );

  config.rules = [
    ...aiConnectionRules.filter((rule) => !existingRules.has(rule)),
    ...originalRules,
  ];

  return config;
}
