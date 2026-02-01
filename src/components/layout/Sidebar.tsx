'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Plus, Settings, User, LogOut, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNetwork } from '@/contexts/NetworkContext';
import { useReferrals } from '@/lib/db/hooks';
import { ThemeToggle } from '@/components/theme';
import { Switch } from '@/components/ui/switch';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
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
  const { isOnline, toggleNetwork } = useNetwork();
  const { syncAll, referrals } = useReferrals();
  const [isSyncing, setIsSyncing] = useState(false);
  const { state } = useSidebar();

  const unsyncedCount = referrals.filter((r) => !r.isSynced).length;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleSync = async () => {
    if (isOnline && unsyncedCount > 0) {
      setIsSyncing(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await syncAll();
      setIsSyncing(false);
    }
  };

  // Use provided items, otherwise default to nurse nav
  const navItems = navItemsProp ?? (isNurse ? nurseNavItems : []);

  return (
    <ShadcnSidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
              <div className="relative w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shadow-sm shrink-0 overflow-hidden">
                <Image className="p-1" src="/icon.png" alt="CareLink logo" width={32} height={32} />
              </div>
              <span className="text-lg font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                CareLink
              </span>
            </div>
            <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
          </div>
          <div className="hidden group-data-[collapsible=icon]:flex justify-center pb-1">
            <SidebarTrigger />
          </div>
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

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleSync}
                  tooltip={state === 'collapsed' ? 'Sync referrals' : undefined}
                  disabled={!isOnline || unsyncedCount === 0 || isSyncing}
                  className={`
                    transition-all duration-200 pr-10
                    ${isSyncing ? 'bg-interactive-muted border-interactive-muted' : ''}
                    ${unsyncedCount > 0 && isOnline ? 'border-interactive hover:bg-interactive-muted hover:border-interactive' : ''}
                  `}
                >
                  <RefreshCw className={`${isSyncing ? 'animate-spin text-interactive-foreground' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync referrals'}</span>
                </SidebarMenuButton>
                {unsyncedCount > 0 && (
                  <SidebarMenuBadge className="bg-interactive-muted text-interactive-foreground">
                    {unsyncedCount}
                  </SidebarMenuBadge>
                )}
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton tooltip={state === 'collapsed' ? 'Network' : undefined} className="pr-12">
                  {isOnline ? (
                    <Wifi className="text-completed-foreground" />
                  ) : (
                    <WifiOff className="text-muted-foreground" />
                  )}
                  <span>Network</span>
                  <span className="ml-auto text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </SidebarMenuButton>
                <SidebarMenuAction asChild>
                  <div className="flex items-center">
                    <Switch
                      checked={isOnline}
                      onCheckedChange={toggleNetwork}
                      className="data-[state=checked]:bg-completed"
                    />
                  </div>
                </SidebarMenuAction>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {/* User Info */}
        <SidebarMenu className="group-data-[collapsible=icon]:items-center">
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
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
