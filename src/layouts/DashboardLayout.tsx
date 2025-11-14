import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger, SidebarFooter, SidebarSeparator } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Home, BarChart3, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full">
        <Sidebar variant="floating" collapsible="icon" contentClassName="rounded-3xl bg-[hsl(210_60%_20%)] text-white shadow-xl">
          <SidebarHeader className="pt-4">
            <div className="flex items-center gap-2 px-3">
              <span className="text-lg font-semibold tracking-tight">LetiManager</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-base text-white">Navigation</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <NavLink to="/" end className={({ isActive }) => isActive ? "block" : "block"}>
                    {({ isActive }) => (
                      <SidebarMenuButton isActive={isActive} tooltip="Home" size="lg" className="text-white hover:bg-white/10 hover:text-white">
                        <Home className="w-5 h-5 text-blue-400" />
                        <span className="text-base">Dashboard</span>
                      </SidebarMenuButton>
                    )}
                  </NavLink>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <NavLink to="/analysis" className={({ isActive }) => isActive ? "block" : "block"}>
                    {({ isActive }) => (
                      <SidebarMenuButton isActive={isActive} tooltip="Analytics" size="lg" className="text-white hover:bg-white/10 hover:text-white">
                        <BarChart3 className="w-5 h-5 text-blue-400" />
                        <span className="text-base">Analysis</span>
                      </SidebarMenuButton>
                    )}
                  </NavLink>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarSeparator className="bg-white/15" />
          <SidebarFooter className="mt-auto">
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-white hover:bg-white/10">
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <TooltipProvider>
            <div className="flex h-12 items-center gap-2 border-b px-3">
              <SidebarTrigger />
              <span className="font-medium">Dashboard</span>
            </div>
            <div className="flex-1 p-4">
              <Outlet />
            </div>
          </TooltipProvider>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
