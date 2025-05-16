// components/sidebar-item.tsx
import { NavItem } from '@/types'
import { Link, usePage } from '@inertiajs/react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Key, useState } from 'react'

export function SidebarItem({ item }: { item: NavItem }) {
  const { url } = usePage()
  const [open, setOpen] = useState(false)

  const isActive = item.activeRoutes 
    ? item.activeRoutes.some((route: string): boolean => url.startsWith(route))
    : url === item.href

  if (item.items) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setOpen(!open)}
          className={`flex items-center w-full p-2 rounded-md ${isActive ? 'bg-accent' : 'hover:bg-accent/50'}`}
        >
          {item.icon && <item.icon className="w-4 h-4 mr-2" />}
          <span className="flex-1 text-left">{item.title}</span>
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        
        {open && (
          <div className="ml-4 space-y-1">
            {item.items.map((subItem: unknown, i: Key | null | undefined) => (
              <SidebarItem key={i} item={subItem as NavItem} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href || '#'}
      className={`flex items-center p-2 rounded-md ${isActive ? 'bg-accent font-medium' : 'hover:bg-accent/50'}`}
    >
      {item.icon && <item.icon className="w-4 h-4 mr-2" />}
      <span>{item.title}</span>
    </Link>
  )
}