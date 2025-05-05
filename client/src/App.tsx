import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import ProductionUnits from "@/pages/production-units";
import Expenses from "@/pages/expenses";
import Revenue from "@/pages/revenue";
import Inventory from "@/pages/inventory";
import Reports from "@/pages/reports";
import ImportExport from "@/pages/import-export";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

function Router() {
  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-secondary-50">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/production-units" component={ProductionUnits} />
            <Route path="/expenses" component={Expenses} />
            <Route path="/revenue" component={Revenue} />
            <Route path="/inventory" component={Inventory} />
            <Route path="/reports" component={Reports} />
            <Route path="/import-export" component={ImportExport} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
