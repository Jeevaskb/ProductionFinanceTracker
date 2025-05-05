import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UserProfile() {
  // In a real app, this would come from an authentication context
  const user = {
    name: "John Doe",
    role: "Financial Manager",
    initials: "JD",
  };

  const handleLogout = () => {
    // In a real app, this would handle the logout process
    console.log("Logout");
  };

  return (
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <Avatar className="h-8 w-8 bg-primary-200 text-primary-700">
          <AvatarFallback>{user.initials}</AvatarFallback>
        </Avatar>
      </div>
      <div className="ml-3">
        <p className="text-sm font-medium text-secondary-800">{user.name}</p>
        <p className="text-xs text-secondary-500">{user.role}</p>
      </div>
      <div className="ml-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="text-secondary-500 hover:text-secondary-700"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
