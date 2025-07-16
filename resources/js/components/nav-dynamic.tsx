// components/nav-dynamic.tsx
import { type NavItem } from "@/types";
import { Link, usePage } from "@inertiajs/react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import { can } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export function NavDynamic({ items, className }: { items: NavItem[]; className?: string }) {
  const { url } = usePage();

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Always show titles
      if (item.isTitle) return true;
      
      // Check permissions if specified
      if (item.permission && !can(item.permission)) return false;
      
      // For groups, check if any child is visible
      if (item.items) {
        return item.items.some(subItem => 
          !subItem.permission || can(subItem.permission)
        );
      }
      
      return true;
    });
  }, [items]);

  if (filteredItems.length === 0) return null;

  return (
    <nav className={cn("flex flex-col space-y-1", className)}>
      {filteredItems.map((item, index) => {
        if (item.isTitle) {
          return (
            <div key={index} className="px-2 py-1 text-xs font-medium text-muted-foreground">
              {item.title}
            </div>
          );
        }

        if (item.items) {
          return <NavDropdown key={index} item={item} currentUrl={url} />;
        }

        const isActive = item.activeRoutes 
          ? item.activeRoutes.some(route => url.startsWith(route))
          : url === item.href;

        return (
          <Link
            key={index}
            href={item.href || '#'}
            className={cn(
              "flex items-center px-3 py-2 text-sm rounded-md",
              isActive 
                ? "bg-accent text-accent-foreground font-medium"
                : "hover:bg-accent/50 hover:text-accent-foreground"
            )}
          >
            {item.icon && <item.icon className="w-4 h-4 mr-3" />}
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function NavDropdown({ item, currentUrl }: { item: NavItem; currentUrl: string }) {
  const [open, setOpen] = useState(
    item.activeRoutes?.some(route => currentUrl.startsWith(route)) || false
  );

  const isActive = item.activeRoutes 
    ? item.activeRoutes.some(route => currentUrl.startsWith(route))
    : false;

  const filteredItems = useMemo(() => {
    return (item.items || []).filter(subItem => 
      !subItem.permission || can(subItem.permission)
    );
  }, [item.items]);

  if (filteredItems.length === 0) return null;

  return (
    <div className="space-y-1">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center w-full px-3 py-2 text-sm rounded-md",
          isActive 
            ? "bg-accent text-accent-foreground font-medium"
            : "hover:bg-accent/50 hover:text-accent-foreground"
        )}
      >
        {item.icon && <item.icon className="w-4 h-4 mr-3" />}
        <span className="flex-1 text-left">{item.title}</span>
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      
      {open && (
        <div className="ml-4 space-y-1">
          <NavDynamic items={filteredItems} />
        </div>
      )}
    </div>
  );
}