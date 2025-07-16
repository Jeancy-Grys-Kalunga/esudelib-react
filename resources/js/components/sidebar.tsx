// components/sidebar.tsx
import { SidebarItem } from './sidebar-item'
import { NavItem } from '@/types'

export function Sidebar({ items }: { items: NavItem[] }) {
  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r">
      <div className="flex flex-col flex-1 min-h-0 p-4 overflow-y-auto">
        <div className="space-y-2">
          {items.map((item, i) => (
            <SidebarItem key={i} item={item} />
          ))}
        </div>
      </div>
    </div>
  )
}