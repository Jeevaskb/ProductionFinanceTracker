import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  BarChart3,
  Factory,
  DollarSign,
  LineChart,
  Archive,
  FileText,
  FileSpreadsheet,
  LogOut,
} from "lucide-react";
import { UserProfile } from "./user-profile";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/use-mobile";

type NavItemProps = {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive: boolean;
  onClick?: () => void;
};

const NavItem = ({ href, icon, children, isActive, onClick }: NavItemProps) => {
  return (
    <Link href={href}>
      <div
        onClick={onClick}
        className={cn(
          "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
          isActive
            ? "bg-primary-50 text-primary-700"
            : "text-secondary-700 hover:bg-secondary-100"
        )}
      >
        <div
          className={cn(
            "text-xl mr-3",
            isActive ? "text-primary-700" : "text-secondary-500"
          )}
        >
          {icon}
        </div>
        {children}
      </div>
    </Link>
  );
};

export function Sidebar() {
  const [location] = useLocation();
  const { isMobile } = useMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebarOnMobile = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-secondary-200 shadow-sm transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:h-screen",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b border-secondary-200">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <BarChart3 className="h-6 w-6 text-primary-700 mr-2" />
                <span className="text-lg font-semibold text-secondary-800">
                  ProductionERP
                </span>
              </div>
            </div>
            <button
              onClick={toggleSidebar}
              className="lg:hidden text-secondary-500 hover:text-secondary-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <nav className="flex-1 px-2 py-4 space-y-1">
            <NavItem
              href="/"
              icon={<BarChart3 size={20} />}
              isActive={location === "/"}
              onClick={closeSidebarOnMobile}
            >
              Dashboard
            </NavItem>
            <NavItem
              href="/production-units"
              icon={<Factory size={20} />}
              isActive={location === "/production-units"}
              onClick={closeSidebarOnMobile}
            >
              Production Units
            </NavItem>
            <NavItem
              href="/expenses"
              icon={<DollarSign size={20} />}
              isActive={location === "/expenses"}
              onClick={closeSidebarOnMobile}
            >
              Expenses
            </NavItem>
            <NavItem
              href="/revenue"
              icon={<LineChart size={20} />}
              isActive={location === "/revenue"}
              onClick={closeSidebarOnMobile}
            >
              Revenue
            </NavItem>
            <NavItem
              href="/inventory"
              icon={<Archive size={20} />}
              isActive={location === "/inventory"}
              onClick={closeSidebarOnMobile}
            >
              Inventory
            </NavItem>
            <NavItem
              href="/reports"
              icon={<FileText size={20} />}
              isActive={location === "/reports"}
              onClick={closeSidebarOnMobile}
            >
              Reports
            </NavItem>
            <NavItem
              href="/import-export"
              icon={<FileSpreadsheet size={20} />}
              isActive={location === "/import-export"}
              onClick={closeSidebarOnMobile}
            >
              Import/Export
            </NavItem>
          </nav>

          <div className="p-4 border-t border-secondary-200">
            <UserProfile />
          </div>
        </div>
      </div>

      {/* Mobile sidebar toggle button */}
      {!isOpen && isMobile && (
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 z-30 lg:hidden rounded-full shadow-lg"
          onClick={toggleSidebar}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </Button>
      )}
    </>
  );
}
