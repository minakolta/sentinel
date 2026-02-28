"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Users,
  Server,
  KeyRound,
  ShieldCheck,
  FileKey2,
  LayoutDashboard,
  Settings,
  ClipboardList,
  LogOut,
  Database,
  Sparkles,
  Menu,
  ChevronDown,
  FolderKanban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Role } from "@/lib/auth";
import { useBranding } from "@/lib/branding";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const mainNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Servers", url: "/servers", icon: Server },
  { title: "Licenses", url: "/licenses", icon: FileKey2 },
  { title: "Credentials", url: "/credentials", icon: KeyRound },
  { title: "Firewall", url: "/firewall-rules", icon: ShieldCheck },
];

const adminNavItems = [
  { title: "Audit Logs", url: "/audit-logs", icon: ClipboardList },
  { title: "Entities", url: "/settings/entities", icon: Database },
  { title: "Settings", url: "/settings", icon: Settings, exactMatch: true },
];

export function TopNav() {
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

  const isActive = (url: string, exactMatch?: boolean) => {
    if (exactMatch) return pathname === url;
    return pathname === url || pathname.startsWith(url + "/");
  };

  const isAdminSectionActive = pathname.startsWith("/audit-logs") || pathname.startsWith("/settings");

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b">
      <div className="mx-auto max-w-screen-2xl">
        <div className="flex h-14 items-center px-4 md:px-6">
          {/* Logo and App Name */}
          <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
            {branding.logo ? (
              <img
                src={branding.logo}
                alt={branding.name}
                className="h-8 w-8 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
            )}
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
              Sentinel
            </span>
          </Link>

          {/* Separator */}
          <div className="hidden md:block h-6 w-px bg-border mx-4" />

          {/* Desktop Navigation with underline */}
          <nav className="hidden md:flex items-center -mb-px">
            {mainNavItems.map((item) => {
              const active = isActive(item.url);
              return (
                <Link
                  key={item.url}
                  href={item.url}
                  className={cn(
                    "relative px-3 py-4 text-sm font-medium transition-colors border-b-2 -mb-px",
                    active
                      ? "text-foreground border-sky-500"
                      : "text-muted-foreground hover:text-foreground border-transparent"
                  )}
                >
                  {item.title}
                </Link>
              );
            })}
            
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center gap-1 px-3 py-4 text-sm font-medium transition-colors border-b-2 -mb-px",
                      isAdminSectionActive
                        ? "text-foreground border-sky-500"
                        : "text-muted-foreground hover:text-foreground border-transparent"
                    )}
                  >
                    Admin
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {adminNavItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.url, item.exactMatch);
                    return (
                      <DropdownMenuItem key={item.url} asChild>
                        <Link 
                          href={item.url} 
                          className={cn(
                            "flex items-center gap-2",
                            active && "text-sky-600 dark:text-sky-400 font-medium"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {item.title}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right side actions */}
          <div className="flex items-center gap-1">
            <NotificationBell />
            <ThemeToggle />
            
            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full ml-1">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session?.user?.image ?? undefined} />
                    <AvatarFallback className="text-xs bg-gradient-to-br from-sky-500 to-blue-600 text-white">
                      {getInitials(session?.user?.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session?.user?.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session?.user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="flex items-center gap-2.5">
                    {branding.logo ? (
                      <img
                        src={branding.logo}
                        alt={branding.name}
                        className="h-7 w-7 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 text-white">
                        <Sparkles className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <span className="text-lg font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                      Sentinel
                    </span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col p-2">
                  {mainNavItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.url);
                    return (
                      <Link
                        key={item.url}
                        href={item.url}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.title}
                        {active && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sky-500" />
                        )}
                      </Link>
                    );
                  })}
                  
                  {isAdmin && (
                    <>
                      <div className="my-2 border-t" />
                      <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Admin
                      </p>
                      {adminNavItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.url, item.exactMatch);
                        return (
                          <Link
                            key={item.url}
                            href={item.url}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                              active
                                ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            {item.title}
                            {active && (
                              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sky-500" />
                            )}
                          </Link>
                        );
                      })}
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
