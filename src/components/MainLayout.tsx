import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu, Plus, Trash2, Folder, X } from "lucide-react";
import { useAppStore } from "../lib/store";
import { cn } from "../lib/utils";
import { Sidebar } from "./Sidebar";

export const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] w-full bg-[#fffbeb] text-[#78350f] font-sans overflow-hidden relative">
      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-[#fef3c7] shadow-xl transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:shadow-none md:border-r border-[#fde68a]",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
        <Outlet context={{ openSidebar: () => setIsSidebarOpen(true) }} />
      </div>
    </div>
  );
};
