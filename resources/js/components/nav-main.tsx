import { type NavItem, type GroupedNavItem } from '@/types';

interface NavMainProps {
  items: NavItem[];
  groupedItems?: GroupedNavItem[];
}

export function NavMain({ items = [], groupedItems = [] }: NavMainProps) {
  return (
    <div className="flex flex-col space-y-1">
      {/* Rendu des items simples */}
      {items.map((item, index) => (
        <NavItemComponent key={`item-${index}`} item={item} />
      ))}
      
      {/* Rendu des items groupés */}
      {groupedItems.map((group, index) => (
        <div key={`group-${index}`} className="mt-2">
          <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {group.groupTitle}
          </h3>
          {group.items.map((item, itemIndex) => (
            <NavItemComponent key={`group-item-${itemIndex}`} item={item} />
          ))}
        </div>
      ))}
    </div>
  );
}

function NavItemComponent({ item }: { item: NavItem }) {
  return (
    <a
      href={item.href}
      className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
        item.isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      {item.icon && (
        <item.icon className={`flex-shrink-0 h-5 w-5 mr-3 ${item.color || ''}`} />
      )}
      {item.title}
    </a>
  );
}