import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const overridePath = path.join(toolDir, "..", "overrides", "通用3合1覆写.js");
const source = fs.readFileSync(overridePath, "utf8");
const context = vm.createContext({});
vm.runInContext(source, context);

const input = {
  proxies: [
    { name: "香港01", type: "ss" },
    { name: "日本02", type: "ss" },
    { name: "美国03", type: "ss" },
    { name: "其它地区04", type: "ss" },
    { name: "套餐到期：2099-12-31", type: "ss" },
    { name: "套餐重置：30天", type: "ss" },
    { name: "订阅获取时间：现在", type: "ss" },
  ],
  "proxy-groups": [
    { name: "旧策略组", type: "select", proxies: ["香港01", "套餐到期：2099-12-31"] },
  ],
  rules: ["MATCH,旧策略组"],
};

const result = context.main(input);
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const proxyNames = new Set(result.proxies.map((proxy) => proxy.name));
assert(proxyNames.size === 4, "真实节点没有被完整保留，或信息节点没有被完整删除。");
assert(![...proxyNames].some((name) => /套餐到期|套餐重置|订阅获取时间/.test(name)), "仍存在订阅信息节点。");
assert(result["keep-alive-idle"] === 60, "keep-alive-idle 不正确。");
assert(result["keep-alive-interval"] === 30, "keep-alive-interval 不正确。");
assert(result["disable-keep-alive"] === false, "TCP 保活没有启用。");

const groupNames = new Set(result["proxy-groups"].map((group) => group.name));
assert(!groupNames.has("旧策略组"), "旧策略组没有被替换。");
assert(groupNames.size === result["proxy-groups"].length, "存在重复的策略组名称。");

const builtIns = new Set(["DIRECT", "REJECT"]);
for (const group of result["proxy-groups"]) {
  for (const reference of group.proxies || []) {
    assert(
      proxyNames.has(reference) || groupNames.has(reference) || builtIns.has(reference),
      `策略组 ${group.name} 引用了不存在的节点或组：${reference}`,
    );
  }
}

for (const rule of result.rules) {
  const parts = rule.split(",");
  const policy = parts.at(-1) === "no-resolve" ? parts.at(-2) : parts.at(-1);
  if (policy.startsWith("通用｜")) {
    assert(groupNames.has(policy), `规则引用了不存在的策略组：${policy}`);
  }
}

console.log(
  JSON.stringify({
    preservedNodes: proxyNames.size,
    groups: groupNames.size,
    rules: result.rules.length,
    tcpKeepAlive: true,
    danglingReferences: 0,
  }),
);
