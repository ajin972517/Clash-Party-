# 来源与修改内容

此包基于 [Clash Party v2.0.3](https://github.com/mihomo-party-org/clash-party/releases/tag/v2.0.3) 的 Windows x64 程序文件制作。对应的[上游源码](https://github.com/mihomo-party-org/clash-party/tree/v2.0.3)和本项目的[修改脚本](https://github.com/ajin972517/Clash-Party-/tree/main/icon-customization/scripts)可用于核对与重建。它不是 Clash Party 官方发布的安装包。

图形源文件 `assets/logo-white.svg` 是用户提供的版本，基于 [Clash Nyanpasu 的 logo-white.svg](https://github.com/libnyanpasu/clash-nyanpasu/blob/main/frontend/nyanpasu/src/assets/image/logo-white.svg) 调整。上游两个项目均标示 GPL-3.0；许可文本随本项目放在 `licenses/`。

## 2026-09-27 对 v2.0.3 的改动

1. 将 `Clash Party.exe` 的 Windows 图标资源替换为 `logo-white-windows.ico` 中的 16、32、48、64、128、256 像素图层。版本信息及其他非图标资源保持不变。
2. 将 `resources/app.asar` 中的 `resources/icon.png` 替换为从 `logo-white.svg` 制作的 512×512 PNG。
3. 将主界面标题栏和左侧标题的两处旧图标组件替换为同一 SVG 图像。
4. 连接页对 `Clash Party.exe` 路径的旧进程图标缓存只清理一次，使它重新提取 EXE 的新图标。其他程序的图标缓存不受影响。

托盘的白、蓝、绿、红状态图标没有修改。程序包不包含用户的订阅、节点、密码或 `%APPDATA%\mihomo-party` 个人配置。

本次修改在 Windows 上运行并由用户确认：主界面、资源管理器、任务管理器和连接列表中的图标均显示为新图；Clash Party 与 mihomo 进程正常启动。每次应用更新后都需要基于新版本重新制作与检查，不能将 v2.0.3 的 `app.asar` 或 EXE 覆盖到新版本。

