# Clash Mi、Clash Party 与 Stash 个人分流覆写

这个仓库保存两份可重复使用的分流覆写。更换机场后，不需要再复制旧机场的完整配置，只要给新订阅继续启用对应的覆写文件，就能保留原来的服务分流、直连、广告拦截和漏网流量策略。

## 文件说明

| 文件 | 适用客户端 | 说明 |
| --- | --- | --- |
| [`ClashMi-ClashParty-个人分流覆写.js`](./ClashMi-ClashParty-个人分流覆写.js) | Clash Mi、Clash Party | JavaScript 覆写，包含分流策略、动态节点引用和 Mihomo TCP Keep Alive 参数。 |
| [`Stash-个人分流覆写.stoverride`](./Stash-个人分流覆写.stoverride) | Stash | Stash 专用 YAML 覆写，使用 `include-all: true` 自动引用当前订阅的节点。 |

## 主要内容

- 保留原配置中的39个分流策略组和15,529条有效规则。
- 新增“♻️ 自动选择”，切换机场后可以自动测试并选择可用节点。
- 自动接收当前订阅中的节点和代理集合，不依赖旧机场的节点名称。
- 覆盖机场自带的 `proxy-groups` 和 `rules`，但保留机场提供的 `proxies`、`proxy-providers`、DNS、TUN、重写和脚本等其他配置。
- 文件中不包含机场订阅地址、服务器、端口、密码或旧节点名称。

Clash Mi 和 Clash Party 的 JavaScript 覆写包含以下 Mihomo TCP Keep Alive 参数：

```yaml
keep-alive-idle: 60
keep-alive-interval: 30
disable-keep-alive: false
```

Stash 官方配置文档没有声明支持这三个 Mihomo 参数，因此 Stash 版本没有加入它们。

## Clash Party 使用方法

1. 打开左侧“覆写”。
2. 选择打开本地文件，导入 `ClashMi-ClashParty-个人分流覆写.js`。
3. 打开“订阅管理”，点击目标订阅右上角的三个点，然后选择“编辑信息”。
4. 在“覆写”中选择刚导入的 JavaScript 文件并保存。
5. 更新订阅，重新连接后检查“🚀 节点选择”和“♻️ 自动选择”是否包含当前机场节点。

## Clash Mi 使用方法

1. 将 `ClashMi-ClashParty-个人分流覆写.js` 导入 Clash Mi 的自定义覆写配置。
2. 打开“我的配置”或“当前配置”，编辑目标机场订阅。
3. 在“核心覆写”或“自定义覆写配置”中选择这份 JavaScript 文件。
4. 更新订阅并重新连接。
5. 在面板和当前运行配置中检查策略组与 TCP Keep Alive 参数是否生效。

不同版本的菜单名称可能略有差异。DNS 和 TUN 可以继续使用 Clash Mi 的应用内覆写设置。

## Stash 使用方法

1. 先在 Stash 中正常添加机场的 Clash/YAML 订阅。
2. 下载 `Stash-个人分流覆写.stoverride`，在系统“文件”App 中点击分享并选择用 Stash 打开；也可以在 Stash 的“覆写”页面从本地文件导入。
3. 进入 Stash 的“覆写”页面，启用“个人机场分流规则”。
4. 如果还启用了其他会修改 `proxy-groups` 或 `rules` 的覆写，把本文件放在它们后面。
5. 更新机场订阅并重启 Stash。
6. 确认“🚀 节点选择”和“♻️ 自动选择”中出现了当前机场节点。

## 更换机场

更换机场时，只需要导入新的 Clash/Mihomo YAML 订阅，并给新订阅启用对应的覆写文件。不要把旧机场的完整配置复制到新订阅中，否则可能同时带入已经失效的节点和凭据。

首次启用新机场后，建议测试 Google、ChatGPT、Steam、国内直连、广告拦截和漏网流量。部分机场可能包含自己的内网、免流或特殊直连规则；这两份文件会完整替换机场自带规则，如有需要，应先把这些特殊规则合并到个人规则中。

## 注意事项

- 分流规则按从上到下的顺序首次匹配。文件保留了原有规则顺序和重复项，避免去重后改变实际分流结果。
- 规则数量较多。Clash Mi 在 iOS 上受 VPN 扩展内存限制，如果连接后立即断开，可以考虑改用远程规则集或 MRS 精简版本。
- 本仓库是公开仓库。请勿提交机场订阅链接、节点密码、令牌、Cookie 或其他账户凭据。

## 参考文档

- [Clash Party 覆写](https://clashparty.org/docs/guide/override)
- [Clash Mi FAQ](https://clashmi.app/guide/faq)
- [Mihomo 策略组](https://wiki.metacubex.one/config/proxy-groups/)
- [Stash 覆写文件](https://stash.wiki/configuration/override)
- [Stash 策略组](https://stash.wiki/proxy-protocols/proxy-groups)
