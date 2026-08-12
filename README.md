# Clash Party个人代理节点规则

这是一个面向 Clash Party/Mihomo 的个人覆写项目，用于在保留订阅真实节点的基础上，统一整理策略组、分流规则和 TCP 长连接参数。

## 推荐使用：通用 3 合 1 覆写

`overrides/通用3合1覆写.js` 是本项目的推荐入口，一个文件同时完成以下工作：

- 保留当前订阅中的全部真实代理节点；
- 自动删除“套餐到期”“套餐重置”“订阅获取时间”等信息节点；
- 清理旧策略组及其引用，重新生成统一的策略组；
- 按节点名称自动识别香港、台湾、日本、新加坡和美国节点；
- 未识别地区的节点仍保留在“节点选择”和“自动选择”中；
- 加载个人分流规则，覆盖 Google、AI、Adobe、流媒体、游戏平台等常用服务；
- 启用 TCP 保活，减少 WebSocket 和其他长连接因空闲而中断的概率。

## 使用方法

1. 打开 Clash Party，进入“订阅”页面。
2. 打开“覆写”，新建一个 JavaScript 覆写。
3. 导入或粘贴 `overrides/通用3合1覆写.js` 的完整内容。
4. 将这个覆写绑定到需要使用的订阅。
5. 更新订阅，确认配置可以正常生成并加载。
6. 在策略组页面根据需要选择自动节点、指定地区或具体节点。

使用通用版时，不要再给同一订阅同时绑定下面三个单项覆写，以免不同覆写重复修改 `proxy-groups` 和 `rules`。

## 其他三个单项覆写

这些文件继续保留，适合只启用某一项功能、排错或对比配置：

- `overrides/BoostNet.yaml`：原始 BoostNet 策略组和完整分流规则；节点名称与 BoostNet 订阅结构相关。
- `overrides/TCP保活.yaml`：只设置 TCP 保活，不修改节点、策略组和分流规则。
- `overrides/WgetCloud-Info-Nodes.js`：只删除 WgetCloud 中的信息节点，并清理原策略组里的相关引用。

## TCP 保活参数

```yaml
keep-alive-idle: 60
keep-alive-interval: 30
disable-keep-alive: false
```

- 连接空闲 60 秒后开始发送保活探测；
- 后续探测间隔为 30 秒；
- TCP 保活保持启用状态。

## 通用覆写的策略行为

- 通用覆写会保留订阅的 `proxies`，但会重新生成 `proxy-groups` 和 `rules`。
- 主策略组同时提供自动选择、地区选择、具体节点和直连选项。
- 地区识别依赖节点名称；命名特别特殊的节点可能不会进入对应地区组，但仍会保留在主策略组中。
- 当前分流规则由 `BoostNet.yaml` 生成，共 15,490 条；策略组前缀统一为 `通用｜`，避免不同订阅之间的选择缓存互相干扰。

## 项目维护

- `tools/build-universal-override.mjs`：从 `BoostNet.yaml` 提取分流规则并重新生成通用覆写。
- `tools/test-universal-override.mjs`：检查节点过滤、策略组引用、分流规则和 TCP 保活参数。

重新生成和测试：

```powershell
node tools\build-universal-override.mjs
node --check overrides\通用3合1覆写.js
node tools\test-universal-override.mjs
```

## 注意事项

- 导入前建议备份当前覆写和订阅配置。
- 不要将订阅地址、节点服务器、密码、令牌、控制器密钥或其他凭据提交到仓库。
- 每次修改或重新生成后，应在 Clash Party 中更新订阅并确认配置能够正常加载。
- 本项目是个人配置备份，不代表适合所有机场的节点命名和使用习惯。
