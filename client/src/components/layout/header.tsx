import { useState } from "react";
import { useLocation } from "wouter";
import { Menu, Search, Bell, HelpCircle, Sun, Moon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/ui/theme-provider";

export function Header() {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const [search, setSearch] = useState("");

  const getPageTitle = () => {
    switch (location) {
      case "/":
        return "Dashboard";
      case "/production-units":
        return "Production Units";
      case "/expenses":
        return "Expenses";
      case "/revenue":
        return "Revenue";
      case "/inventory":
        return "Inventory";
      case "/reports":
        return "Reports";
      case "/import-export":
        return "Import/Export";
      default:
        return "Dashboard";
    }
  };

  return (
    <header className="bg-white border-b border-secondary-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        <div className="flex items-center">
          <Menu className="lg:hidden text-secondary-500 hover:text-secondary-700 mr-2" />
          <h1 className="text-lg font-semibold text-secondary-900">
            {getPageTitle()}
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative hidden md:block">
            <Input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="py-1.5 pl-9 pr-3 text-sm rounded-md border border-secondary-300 bg-secondary-50 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 w-64"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 h-4 w-4" />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-secondary-500 hover:text-secondary-700 relative"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500"></span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-secondary-500 hover:text-secondary-700"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-secondary-500 hover:text-secondary-700"
              >
                {theme === "light" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
