import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger, SidebarFooter, SidebarSeparator } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Home, BarChart3, Thermometer, LogOut, Wrench, Package } from "lucide-react";
import { useAuth } from "@/lib/auth";

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const username = user?.username || "Guest";
  const initials = username.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full">
        <Sidebar
          variant="sidebar"
          collapsible="none"
          className="border-r-0 sticky top-0 h-screen overflow-hidden"
          contentClassName="!bg-[#0c4a6e] text-white"
        >
          {/* Header / Logo */}
          <SidebarHeader className="pt-8 pb-6 px-6 !bg-[#0c4a6e]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#009ADE] flex items-center justify-center shrink-0">
                <div className="w-6 h-6 text-white fill-current">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 11.5373 21.3065 1.26846 21.0898 1.48514C16.8924 5.68261 14.4682 6.64161 12 6.64161C9.53177 6.64161 7.10763 5.68261 2.91016 1.48514C2.69348 1.26846 2 11.5373 2 12C2 17.5228 6.47715 22 12 22Z" fillOpacity="0" stroke="none" />
                    {/* Using a simple droplet shape or similar */}
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-xl font-bold text-white tracking-tight">SmartPool</span>
                  <span className="text-xl font-bold text-[#009ADE] tracking-tight">Pro</span>
                </div>
                <span className="text-[10px] font-bold text-white/80 tracking-wider uppercase">Advanced Management</span>
              </div>
            </div>
          </SidebarHeader>

          {/* Navigation */}
          <SidebarContent className="px-4 gap-2 !bg-[#0c4a6e]">
            <SidebarMenu className="gap-2">
              <SidebarMenuItem>
                <NavLink to="/dashboard" end>
                  {({ isActive }) => (
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip="Dashboard"
                      className={`h-auto py-3 px-4 rounded-xl transition-all hover:bg-white/10 ${isActive ? 'bg-[#009ADE] text-white shadow-lg shadow-blue-900/20 hover:bg-[#009ADE] hover:text-white' : 'text-white hover:text-white'}`}
                    >
                      <Home className="w-6 h-6" />
                      <span className="text-lg font-bold">Dashboard</span>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <NavLink to="/sensors">
                  {({ isActive }) => (
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip="Sensors"
                      className={`h-auto py-3 px-4 rounded-xl transition-all hover:bg-white/10 ${isActive ? 'bg-[#009ADE] text-white shadow-lg shadow-blue-900/20 hover:bg-[#009ADE] hover:text-white' : 'text-white hover:text-white'}`}
                    >
                      <Thermometer className="w-6 h-6" />
                      <span className="text-lg font-bold">Sensors</span>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <NavLink to="/analysis">
                  {({ isActive }) => (
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip="Analysis"
                      className={`h-auto py-3 px-4 rounded-xl transition-all hover:bg-white/10 ${isActive ? 'bg-[#009ADE] text-white shadow-lg shadow-blue-900/20 hover:bg-[#009ADE] hover:text-white' : 'text-white hover:text-white'}`}
                    >
                      <BarChart3 className="w-6 h-6" />
                      <span className="text-lg font-bold">Analysis</span>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <NavLink to="/maintainence">
                  {({ isActive }) => (
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip="Maintainence"
                      className={`h-auto py-3 px-4 rounded-xl transition-all hover:bg-white/10 ${isActive ? 'bg-[#009ADE] text-white shadow-lg shadow-blue-900/20 hover:bg-[#009ADE] hover:text-white' : 'text-white hover:text-white'}`}
                    >
                      <Wrench className="w-6 h-6" />
                      <span className="text-lg font-bold">Maintainence</span>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <NavLink to="/inventory">
                  {({ isActive }) => (
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip="Inventory"
                      className={`h-auto py-3 px-4 rounded-xl transition-all hover:bg-white/10 ${isActive ? 'bg-[#009ADE] text-white shadow-lg shadow-blue-900/20 hover:bg-[#009ADE] hover:text-white' : 'text-white hover:text-white'}`}
                    >
                      <Package className="w-6 h-6" />
                      <span className="text-lg font-bold">Inventory</span>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>
            </SidebarMenu>

          </SidebarContent>

          <SidebarFooter className="p-4 pt-0 !bg-[#0c4a6e]">
            {/* System Status Card */}
            <div className="mb-2">
              <div className="bg-[#12587A] rounded-2xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">System Status</h3>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
                </div>
                <p className="text-white font-semibold text-sm">All Systems Online</p>
              </div>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
              <div className="w-10 h-10 rounded-full bg-[#009ADE] flex items-center justify-center text-white font-bold text-sm shrink-0">
                {initials}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-white font-bold text-sm leading-tight truncate">{username}</span>
                <span className="text-white/70 text-xs truncate">Administrator</span>
              </div>
              <button onClick={handleLogout} className="text-white/70 hover:text-white transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="bg-[#F8FAFC]">
          <TooltipProvider>
            {/* Keeping the mobile trigger but usually hidden on desktop with this layout */}
            <div className="md:hidden flex h-12 items-center gap-2 border-b px-3 bg-white">
              <SidebarTrigger />
              <span className="font-medium">Dashboard</span>
            </div>
            <div className="flex-1 p-6 md:p-8 overflow-auto">
              <Outlet />
            </div>
          </TooltipProvider>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
