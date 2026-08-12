// Clash Party JavaScript override for the WgetCloud subscription.
// Remove subscription-information entries that are presented as proxy nodes.
function main(config) {
  const excludedNamePatterns = [
    /套餐到期/,
    /套餐重置/,
    /订阅获取时间/,
  ];

  const shouldExclude = (name) =>
    typeof name === "string" &&
    excludedNamePatterns.some((pattern) => pattern.test(name));

  const removedNames = new Set();

  if (Array.isArray(config.proxies)) {
    config.proxies = config.proxies.filter((proxy) => {
      const remove = proxy && shouldExclude(proxy.name);
      if (remove) {
        removedNames.add(proxy.name);
      }
      return !remove;
    });
  }

  if (Array.isArray(config["proxy-groups"])) {
    for (const group of config["proxy-groups"]) {
      if (!group || !Array.isArray(group.proxies)) {
        continue;
      }

      group.proxies = group.proxies.filter(
        (name) => !removedNames.has(name) && !shouldExclude(name),
      );
    }
  }

  return config;
}
