# Clash Party 图标定制项目

这里保存 2026-09-27 为 **Clash Party Windows x64 v2.0.3** 制作的图标素材、修改方法和可复用构建脚本。目标是在软件更新后，从**新版本原版程序**重新生成图标修改版。此项目不是 Clash Party 官方发布。

## 下载与核对

| 文件 | 用途 |
| --- | --- |
| [`assets/logo-white.svg`](assets/logo-white.svg) | 本次使用的图形源文件，画布 `420×490`。 |
| [`assets/logo-white-512.png`](assets/logo-white-512.png) | 从 SVG 渲染的 `512×512` 透明 PNG，供窗口和任务栏读取。 |
| [`assets/logo-white-windows.ico`](assets/logo-white-windows.ico) | Windows EXE 图标，包含 16、32、48、64、128、256 像素图层。 |
| [`icon-assets-2026-09-27.zip`](icon-assets-2026-09-27.zip) | 上面三份素材的压缩包。 |
| [`manifest-2026-09-27.json`](manifest-2026-09-27.json) | 原版、修改版和素材的 SHA-256。 |

**已修改的完整程序包：**[定位2026-9-27 修改版本.zip](https://github.com/ajin972517/Clash-Party-/releases/tag/icon-2026-09-27-v2.0.3)（在 Release 页面的 Assets 中下载）。它是可解压运行的程序目录，不是安装器。ZIP 大小为 **286,020,600 字节**，SHA-256 为：

```text
26d5cba3d8ba94c68c0980319240fe5ccb1f13c80c0ec53b2399c9b089f79d17
```

压缩包包含程序文件，以及 `customization-source/` 下的素材、脚本和来源说明；**不包含** `%APPDATA%\mihomo-party`、机场订阅、节点、密码或个人代理配置。完整程序 ZIP 超过 GitHub 仓库的 100 MiB 单文件上限，所以放在同仓库的 Release 附件；本文件夹只存放小型素材与可复用源码。

## 2026-09-27 实际改动

1. `Clash Party.exe` 内嵌的 Windows 图标组换成 `logo-white-windows.ico`。资源管理器和任务管理器读取这一处。
2. `resources/app.asar` 内的 `resources/icon.png` 换成 `logo-white-512.png`。窗口标题栏与任务栏使用这一处。
3. 主界面标题栏和左侧标题的两枚旧猫图标换成 `logo-white.svg`。
4. 连接页按程序路径保存进程图标。为 `Clash Party.exe` 增加一次性旧缓存清理，使连接列表重新提取新 EXE 图标；其他程序缓存不受影响。

托盘的白、蓝、绿、红状态图标没有修改。本次 v2.0.3 已在 Windows 上运行，用户确认主界面、资源管理器、任务管理器和连接列表显示新图，Clash Party 与 mihomo 正常启动。[详细来源与修改记录](SOURCE-AND-CHANGES.md)。

## 新版本更新后重新制作

**先取得新版本的干净原版目录。**不要拿 v2.0.3 的 `Clash Party.exe` 或 `app.asar` 覆盖新版本，也不要以本项目已修改的程序目录作为构建输入。先保存原版安装目录的完整备份；个人配置位于其他目录，本脚本不会读取或修改它。

在 Windows 上安装 Node.js **22.12 或更高版本**，打开本文件夹的 PowerShell 终端，执行：

```powershell
npm ci
node .\scripts\build-from-install.mjs "F:\路径\Clash Party 新版本原版" "F:\路径\Clash Party 新版本图标副本"
```

输出目录必须不存在。脚本只生成**独立副本**，不会关闭或替换正在运行的程序。它检查 Electron 的 ASAR 完整性开关、EXE 图标组、主界面两处图标调用和连接页缓存逻辑，然后修改副本里的 EXE 与 `resources/app.asar`，最后生成 `ICON-CUSTOMIZATION-MANIFEST.json`。

若新版改了代码结构、图标组、签名或 ASAR 完整性设置，脚本会报错并停止。此时先检查新版本，再调整脚本；不要强行复用旧的 EXE、旧 ASAR，或直接关闭完整性校验。本次 v2.0.3 的干净原版目录已完整执行过这份脚本。

### 安装与检查

1. 核对输出目录中 EXE 和 ASAR 的 SHA-256、版本及图标预览，并保留新版本原版备份。
2. 记录当前 Clash Party 和 mihomo 的实际运行路径。退出 Clash Party 后，确认相关进程结束，再将输出副本的 `Clash Party.exe` 与 `resources/app.asar` 放入**同版本**安装目录。此操作会短暂中断代理。
3. 从安装目录启动程序，确认主窗口和 mihomo 正常出现；检查窗口、任务栏、资源管理器、任务管理器以及“连接”列表中的 Clash Party 图标。
4. 连接页会在首次加载时清理一次该程序的旧图标缓存。若仍显示旧图，先核对连接记录中的 `processPath`、EXE 图标及当前进程路径，再检查缓存；不要清空全部个人配置。

如果启动异常，退出程序，恢复同版本备份中的 EXE 和 ASAR，再启动原版。软件自动更新会覆盖这些修改，每次更新后都需要重复上述流程。

## 更换图形素材

若修改了 `logo-white.svg`，应同时重新生成 PNG 与 ICO，再执行构建脚本。当前版本的生成命令为：

```powershell
magick -background none -density 300 .\assets\logo-white.svg -resize 470x470 -gravity center -extent 512x512 -strip -define png:compression-level=9 .\assets\logo-white-512.png
magick .\assets\logo-white-512.png -define icon:auto-resize=256,128,64,48,32,16 .\assets\logo-white-windows.ico
```

生成后检查透明背景、32 像素缩略图和三份文件的哈希；不要只改 SVG 而保留旧 PNG/ICO。

## 来源与许可

- 应用：[Clash Party v2.0.3 源码与官方发布](https://github.com/mihomo-party-org/clash-party/releases/tag/v2.0.3)。
- 图形来源：[Clash Nyanpasu 的 `logo-white.svg`](https://github.com/libnyanpasu/clash-nyanpasu/blob/main/frontend/nyanpasu/src/assets/image/logo-white.svg)，本项目使用的是用户调整后的版本。
- 两个上游项目均标示 GPL-3.0；许可文本在 [`licenses/`](licenses/)。修改方法和源码见 [`scripts/`](scripts/)。

不要把订阅地址、访问令牌、代理配置或本机用户数据提交到公开仓库。
