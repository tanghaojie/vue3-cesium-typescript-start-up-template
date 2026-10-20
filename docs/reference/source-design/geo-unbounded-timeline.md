---
title: Geo 无界时间轴与每日循环航线方案
status: source-reference
owner: project maintainers
updated: 2026-10-02
---

# Geo 无界时间轴与每日循环航线方案

> 来源规范快照：Cyber-Sight 9697230d7278ae88afb3c82c98e3865181847d08。此文保留来源的功能语义与制作约定；独立应用的当前目录、依赖和部署以 [Geo application design](../../design/geo-workbench.md) 为准。未声明目标浏览器验收通过。

## 背景与目标

Time 插件使用无界 Clock 和独立可见窗口。2026-10-02 起，时间轴改为浏览器本地时区显示，初始窗口与“回到现在”按浏览器本地当天计算；内部时间仍为绝对时刻。

本方案提供具有 Cesium 原生时间轴交互语义的自定义工作台控件：用户可持续平移时间窗口、围绕指针缩放窗口并获得自动适配的浏览器本地刻度；地图、太阳光照、阴影和模拟航班仍只使用一个 `viewer.clock`。原生 Cesium `Animation` 与 `Timeline` 继续保持关闭，以保留现有底部工作台外观、折叠行为和插件边界。

## 范围与非目标

范围：

- 以浏览器本地时区显示和定位任意可操作的仿真时刻；
- 时间轴窗口的平移、缩放、刻度渲染、游标定位、播放/暂停、倍速和“回到现在”；
- 每日固定时刻起飞、在航段内显示、跨日期重复的内置模拟航线；
- Time、Flight、Scene 与底部工作台的状态、生命周期和人工验收调整。

非目标：

- 不重新启用或嵌入 Cesium 原生 Timeline/Animation，不新增第二个 `Clock`；
- 不接入真实航班、历史轨迹、后端、持久化或用户时区选择；日期和夏令时换算由浏览器 Date / Intl 处理，不实现自定义时区数据库；
- 不把时间窗口当作数据过滤器，也不修改外部影像、模型或地形的时间维度；外部模型的运行时昼夜材质使用同一 Clock，按[统一渲染标准](geo-model-rendering.md)处理，不改变资产内容；
- 不扩展太阳光照为月光、天气、人工光源或大气模拟。

## 时间语义

时间轴有两个独立状态，均由 Time 插件拥有：

```text
可见窗口 [viewportStart, viewportStop]  -- 只决定屏幕显示哪段刻度
                 |
                 | 游标定位或播放
                 v
仿真时间 viewer.clock.currentTime        -- 决定太阳、阴影与飞机的位置
```

- `viewer.clock.currentTime` 是唯一仿真时间源；Scene 与 Flight 只读取它，不能创建或维护自己的 Clock。
- Time 插件将 `clockRange` 设为 `ClockRange.UNBOUNDED`，保留 `SYSTEM_CLOCK_MULTIPLIER`。`startTime`、`stopTime` 不再是播放或拖动边界，也不再用作 UI range 的端点。
- 可见窗口不改变场景；用户平移或缩放刻度时，`currentTime`、播放状态和场景画面保持不变。
- 拖动游标、点击刻度或将游标拖出边界后自动滚动时，才写入 `currentTime`；此操作按 Cesium 原生 Timeline 语义暂停播放。
- “回到现在”将 `currentTime` 设为当前绝对时刻，并把窗口复位为浏览器本地当天午夜至次日午夜；夏令时切换日允许 23 / 25 小时。播放只正向推进，沿用现有 `1×`、`10×`、`60×`、`600×`、`3600×` 倍速，反向播放不在本期范围。
- 当前时间和窗口边界显示该时刻的 UTC 偏移，当前时间提示显示浏览器时区名称，主刻度提示显示完整本地日期与偏移；浏览器时区变化后刷新页面重新取值。不得向 epoch milliseconds 或 JulianDate 手工加减时区偏移。浏览器时区可以不同于模型所在地，太阳仍按绝对时刻与地理位置求值。

### 缩放与刻度

可见窗口最小为 1 分钟、最大为 10 年；这个上限只约束一次屏幕呈现，不限制用户持续向过去或未来平移。缩放以指针所在时间为锚点，滚轮向上缩小、向下放大；拖动空白刻度区域平移窗口。

主刻度由窗口长度和可用像素自动选择，标签全部为浏览器本地时间。日、月、年刻度按本地日历对齐，秒、分钟按绝对时长递进以保留夏令时回拨时的重复短时刻度；小时刻度按本地小时递进：

| 可见窗口        | 主刻度候选                         | 次刻度候选         |
| --------------- | ---------------------------------- | ------------------ |
| 1 分钟至 1 小时 | 1、5、10 秒                        | 1 秒以下不显示标签 |
| 1 小时至 1 天   | 1、5、10、30 分钟；1、2、3、6 小时 | 分钟或小时         |
| 1 天至 1 月     | 天                                 | 小时或天           |
| 1 月至 1 年     | 周或月                             | 天或周             |
| 1 年至 10 年    | 年                                 | 月或季度           |

标签之间至少保留可读间距；空间不足时减少标签，而不是重叠。键盘提供聚焦、左右平移、`+`/`-` 缩放和游标定位的等价操作，光照开关、播放和折叠行为保持可访问。

## 每日循环航线

模拟航班使用 UTC 日周期，而非 Time 视窗或 Clock 的 `startTime`/`stopTime`：

- 每条内置航线定义每日起飞秒数、飞行时长、起点、终点和模拟巡航高度；同一 UTC 时刻每天重复相同的航段。
- 当前时刻落在该航线的当日航段内时，飞机按测地线和高度剖面插值显示；起飞前和降落后不显示飞机。完整路线以相同采样位置在三维空间呈现，起降端点自然落地而中途航段不贴地。
- 到次日相同 UTC 起飞时刻，飞机从起点开始下一次循环。跨任意年份拖动都得到相同的每日航班语义，不需要重建全局 Clock 范围。
- Flight 工具以确定性的、按 `JulianDate` 求值的位置属性表达循环位置；不得在 `clock.onTick` 中手工写实体位置。Flight 不读取 Time controller 的私有窗口状态，只在用户开启 Flight 时通过 Time 的最小播放 capability 启动共享 Clock。

这会取代当前“开启 Flight 时复制 `viewer.clock.startTime/stopTime` 并据此生成一天样本”的耦合方式。实施时应更新相关模拟航班 ADR，使其不再把有限 `SampledPositionProperty` 区间描述为长期契约。

## 职责、接口与数据流

Time controller 对 UI 暴露只读状态：`currentTime`、`viewportStart`、`viewportStop`、`multiplier`、`playing`；并提供 `seek`、`panViewport`、`zoomViewport`、`setPlaying`、`setMultiplier`、`resetToNow` 和 `dispose`。UI 不直接赋值 Cesium Clock。

```mermaid
flowchart LR
  TD["TimeDock: pan / zoom / seek"] --> TC["Time controller"]
  TC --> VC["viewer.clock.currentTime"]
  TC --> VP["viewportStart / viewportStop"]
  VC --> SC["Scene: sunlight and shadows"]
  VC --> FL["Flight: UTC daily cycle position"]
  VP --> TD
```

- Time 继续通过 `bottomDocks` contribution 提供 UI；Shell 不导入 Time 或 Flight 组件。
- Scene 继续仅经既有太阳光照 capability 被 Time UI 调用；时间变化本身由共享 Clock 驱动。
- Flight 只依赖真实 Viewer 和自身纯工具，不跨插件导入 Time controller。

## 失败模式与性能

- 小于 1 分钟或大于 10 年的缩放请求被钳制，不产生无效日期或除零比例；日期转换失败时保留上一个有效窗口并反馈可诊断错误。
- 平移、缩放不会触发场景渲染；`seek` 和播放才请求渲染。播放期间 UI 状态同步维持低频，避免每个 Clock tick 触发 Vue 更新。
- Flight 循环计算必须在当前时间不处于航段时返回不可见结果，不得留下上一日的位置或重复实体；关闭插件与离开页面仍清空数据源和监听器。
- 太阳阴影仍是独立、默认关闭的高 GPU 成本功能；无界时间不改变其开关或显式渲染策略。

## 验证与迁移

静态验证沿用格式、TypeScript、lint、架构、生产构建、文档归档检查和 diff 检查。前端自动化与浏览器测试不在仓库范围内。

维护者人工验收至少覆盖：1 分钟、24 小时、1 月和 10 年窗口的刻度可读性；持续向过去/未来平移；缩放锚点稳定；平移不改变昼夜而定位改变昼夜；播放、暂停、倍速和回到现在；开启 Flight 后自动播放并框选 30 条航线；飞机与三维航线高度对齐、配色可区分、隐藏航线后只保留飞机；每日航班在不同日期同一 UTC 时刻复现、航段外隐藏；以及重复进入/退出后无重复监听器或实体。

实现采用 `ClockRange.UNBOUNDED`、独立可见窗口、浏览器本地自适应刻度和 UTC 每日循环航段。除既有验收项外，检查 Asia/Shanghai、Asia/Kolkata、带夏令时的浏览器时区、偏移标记与本地当天窗口；时间轴手势、刻度可读性、太阳变化和航班循环仍需维护者按本设计进行浏览器人工验收。

## 相关计划和 AI 日志

- [浏览器时区与太阳环境光 ADR](https://github.com/tanghaojie/Cyber-Sight/blob/9697230d7278ae88afb3c82c98e3865181847d08/docs/platform/decisions/ADR-20261002-geo-browser-time-and-solar-environment.md)

- [实施计划](https://github.com/tanghaojie/Cyber-Sight/blob/9697230d7278ae88afb3c82c98e3865181847d08/docs/platform/archive/plans/2026-08-31-geo-unbounded-timeline-and-daily-flight-cycle.md)
- [协作记录](https://github.com/tanghaojie/Cyber-Sight/blob/9697230d7278ae88afb3c82c98e3865181847d08/docs/platform/archive/ai-logs/2026/08/2026-08-31-geo-unbounded-timeline-and-daily-flight-cycle.md)
- [当前单一仿真时间 ADR](https://github.com/tanghaojie/Cyber-Sight/blob/9697230d7278ae88afb3c82c98e3865181847d08/docs/platform/decisions/ADR-20260830-geo-simulation-time-and-solar-lighting.md)
- [当前模拟航班 ADR](https://github.com/tanghaojie/Cyber-Sight/blob/9697230d7278ae88afb3c82c98e3865181847d08/docs/platform/decisions/ADR-20260831-geo-simulated-flight-data.md)
- [航班视图、航线与播放联动实施计划](https://github.com/tanghaojie/Cyber-Sight/blob/9697230d7278ae88afb3c82c98e3865181847d08/docs/platform/archive/plans/2026-09-01-geo-flight-visualization-and-playback.md)
