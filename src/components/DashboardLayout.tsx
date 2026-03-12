import { ReactNode, useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background relative overflow-hidden">
      {/* Mobile Header with Hamburger (Visible only on small screens) */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card absolute top-0 left-0 right-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground text-xs">W</div>
          <span className="font-bold text-foreground text-sm">WEBMOK</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      </div>

      {/* Sidebar Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={cn(
        "fixed md:relative inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:transform-none bg-sidebar",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <DashboardSidebar onCloseMobile={() => setMobileMenuOpen(false)} />
      </div>

      <main className="flex-1 w-full md:w-auto h-screen overflow-y-auto overflow-x-hidden pt-16 md:pt-0 p-4 md:p-6 bg-background">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
