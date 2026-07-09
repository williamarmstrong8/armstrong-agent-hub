"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODULES, OWNER } from "@/lib/config";
import { Icon } from "@/components/ui/icon";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-sm)] nu-raised-sm">
              <div className="h-3.5 w-3.5 rotate-45 rounded-[3px] [background:linear-gradient(145deg,#20242c,#0c0e12)]" />
            </div>
            <div className="min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
              <div className="truncate text-sm font-semibold tracking-tight">life-hub</div>
              <div className="text-[11px] text-muted">personal OS</div>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2 py-3">
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {MODULES.map((m) => {
                  const active =
                    m.href === "/" ? pathname === "/" : pathname.startsWith(m.href);
                  return (
                    <SidebarMenuItem key={m.key}>
                      <SidebarMenuButton
                        isActive={active}
                        render={<Link href={m.href} />}
                        tooltip={m.title}
                        className="h-10 rounded-[var(--radius-sm)]"
                      >
                        <span
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px]"
                          style={active ? { color: m.accent } : undefined}
                        >
                          <Icon name={m.icon} size={16} />
                        </span>
                        <span className="font-medium">{m.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-[var(--radius-sm)] nu-inset px-3 py-2.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full nu-raised-sm text-xs font-semibold">
              {OWNER.name.slice(0, 1)}
            </div>
            <div className="min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
              <div className="truncate text-xs font-medium">{OWNER.name}</div>
              <div className="truncate text-[11px] text-muted">{OWNER.role}</div>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4 md:hidden">
          <SidebarTrigger className="-ml-1" />
          <span className="text-sm font-semibold tracking-tight">life-hub</span>
        </header>
        <div className="mx-auto w-full max-w-[1200px] flex-1 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
