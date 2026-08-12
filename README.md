# Clash Party个人代理节点规则

这是我在 Clash Party 中使用的个人覆写配置备份，主要用于：

- 清理订阅中伪装成节点的套餐到期、套餐重置和订阅获取时间等信息项；
- 为 BoostNet 订阅提供个人策略组和分流规则；
- 为 Mihomo/Clash Party 启用 TCP 保活，降低长连接因空闲而中断的概率。

## 文件说明

- `overrides/WgetCloud-Info-Nodes.js`：WgetCloud JavaScript 覆写，移除订阅信息节点，并同步清理策略组中的对应引用。
- `overrides/BoostNet.yaml`：BoostNet YAML 覆写，包含个人策略组与分流规则。
- `overrides/TCP保活.yaml`：TCP 保活参数。

## 使用方法

1. 打开 Clash Party，进入“订阅”页面。
2. 在“覆写”中分别新建或导入对应类型的覆写：
   - `.js` 文件选择 JavaScript 覆写；
   - `.yaml` 文件选择 YAML 覆写。
3. 将 `WgetCloud-Info-Nodes.js` 绑定到 WgetCloud 订阅。
4. 将 `BoostNet.yaml` 绑定到 BoostNet 订阅。
5. 将 `TCP保活.yaml` 作为全局覆写，或绑定到需要启用 TCP 保活的订阅。
6. 更新订阅并检查生成后的配置是否能正常加载。

## TCP 保活参数

```yaml
keep-alive-idle: 60
keep-alive-interval: 30
disable-keep-alive: false
```

- `keep-alive-idle: 60`：TCP 连接空闲 60 秒后开始发送保活探测。
- `keep-alive-interval: 30`：后续保活探测间隔为 30 秒。
- `disable-keep-alive: false`：不禁用 TCP 保活。

## 注意事项

- 这些规则基于个人订阅中的节点名称和策略组结构；其他订阅直接套用时，可能需要修改节点名或组名。
- `BoostNet.yaml` 会替换 `proxy-groups` 和 `rules`，导入前请备份原配置。
- 仓库不应保存订阅地址、节点服务器、密码、令牌、控制器密钥或其他凭据。
- 每次修改后建议在 Clash Party 中重新生成配置并确认无语法错误。
