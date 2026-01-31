'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Plus, Settings, User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/theme';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const nurseNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/scan', label: 'New Referral', icon: Plus },
  { href: '/nurse-settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  navItems?: NavItem[];
}

export function AppSidebar({ navItems: navItemsProp }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isNurse } = useAuth();
  const { state } = useSidebar();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Use provided items, otherwise default to nurse nav
  const navItems = navItemsProp ?? (isNurse ? nurseNavItems : []);

  return (
    <ShadcnSidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between px-2 py-2">
          <div className="flex items-center gap-2">
            {/* Show logo in expanded state, trigger button in collapsed state */}
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-sm shrink-0 group-data-[collapsible=icon]:hidden">
              <span className="text-white text-sm font-bold">R</span>
            </div>
            <div className="hidden group-data-[collapsible=icon]:block">
              <SidebarTrigger />
            </div>
            <span className="text-lg font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              ReferralLoop
            </span>
          </div>
          <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={state === 'collapsed' ? item.label : undefined}
                    >
                      <Link href={item.href}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {/* User Info */}
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
                <User className="h-4 w-4" />
              </div>
              {user && (
                <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
                  <span className="text-sm font-medium truncate">{user.name}</span>
                  <span className="text-xs text-sidebar-foreground/70 truncate">{user.email}</span>
                </div>
              )}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Theme Toggle */}
        <div className="px-2 py-2">
          <div className="group-data-[collapsible=icon]:hidden mb-2">
            <p className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider px-2">
              Theme
            </p>
          </div>
          <ThemeToggle compact={state === 'collapsed'} />
        </div>

        {/* Logout Button */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip={state === 'collapsed' ? 'Log out' : undefined}
              className="text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut />
              <span>Log Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </ShadcnSidebar>
  );
}
