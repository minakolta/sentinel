"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  Server,
  KeyRound,
  ShieldCheck,
  FileKey2,
  LayoutDashboard,
  Settings,
  ClipboardList,
  ChevronsUpDown,
  LogOut,
  Database,
  Sparkles,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession, signOut } from "next-auth/react";
import { Role } from "@/lib/auth";
import { useBranding } from "@/lib/branding";

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Customers",
    url: "/customers",
    icon: Users,
  },
  {
    title: "Servers",
    url: "/servers",
    icon: Server,
  },
  {
    title: "Licenses",
    url: "/licenses",
    icon: FileKey2,
  },
  {
    title: "Credentials",
    url: "/credentials",
    icon: KeyRound,
  },
  {
    title: "Firewall Rules",
    url: "/firewall-rules",
    icon: ShieldCheck,
  },
];

const adminNavItems = [
  {
    title: "Audit Logs",
    url: "/audit-logs",
    icon: ClipboardList,
  },
  {
    title: "Entities",
    url: "/settings/entities",
    icon: Database,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    exactMatch: true,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const branding = useBranding();
  const isAdmin = session?.user?.role === Role.ADMIN;

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="h-14 border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-transparent">
              <Link href="/dashboard">
                {branding.logo ? (
                  <img 
                    src={branding.logo} 
                    alt={branding.name} 
                    className="size-8 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sm">
                    <Sparkles className="size-4" />
                  </div>
                )}
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold tracking-tight">{branding.name}</span>
                  <span className="text-[11px] text-muted-foreground">Infrastructure Tracker</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        <SidebarGroup className="py-4">
          <SidebarGroupLabel className="px-4 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <SidebarMenu className="gap-1">
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.url}
                    className="h-9 rounded-lg data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-medium"
                  >
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup className="py-4 border-t">
            <SidebarGroupLabel className="px-4 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
              Administration
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-2">
              <SidebarMenu className="gap-1">
                {adminNavItems.map((item) => {
                  const isActive = item.exactMatch 
                    ? pathname === item.url 
                    : pathname.startsWith(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive}
                        className="h-9 rounded-lg data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-medium"
                      >
                        <Link href={item.url}>
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="h-12 rounded-lg data-[state=open]:bg-accent"
                >
                  <Avatar className="h-8 w-8 rounded-lg ring-2 ring-background">
                    <AvatarImage src={session?.user?.image ?? undefined} alt={session?.user?.name ?? "User"} />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-medium">
                      {getInitials(session?.user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{session?.user?.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {session?.user?.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl"
                side="top"
                align="end"
                sideOffset={8}
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{session?.user?.name}</p>
                    <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                  Role: {session?.user?.role}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  <LogOut className="mr-2 size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
