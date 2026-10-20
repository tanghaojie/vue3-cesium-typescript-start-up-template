import symbolIds from 'virtual:svg-icons-names'

// 构建插件提供 sprite symbol ID；注册表将其归一为菜单配置使用的短名称。
function iconNameFromSymbolId(symbolId: string): string {
  return symbolId.startsWith('icon-') ? symbolId.slice('icon-'.length) : symbolId
}

export const iconNames = Object.freeze(
  [...new Set(symbolIds.map(iconNameFromSymbolId))].sort(function sortIconNames(left, right) {
    return left.localeCompare(right)
  }),
)

const iconNameSet = new Set(iconNames)

export const iconOptions = Object.freeze(
  iconNames.map(function toIconOption(name) {
    return { value: name, label: name }
  }),
)

export function resolveIconName(name: string): string {
  // 未知图标统一回退到 alert，避免渲染一个静默消失的 <use> 引用。
  return iconNameSet.has(name) ? name : 'alert'
}
