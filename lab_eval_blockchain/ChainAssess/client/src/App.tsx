import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MetaMaskProvider } from '@metamask/sdk-react';
import Landing from "@/pages/Landing";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import BatchManagementPage from "@/pages/BatchManagementPage";

const metaMaskSDKOptions = {
  dappMetadata: {
    name: "EduChain dApp",
    url: window.location.href,
  },
  checkInstallationImmediately: false,
};

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/submit-assignment" component={Dashboard} />
      <Route path="/my-tokens" component={Dashboard} />
      <Route path="/assignments" component={Dashboard} />
      <Route path="/rewards" component={Dashboard} />
      <Route path="/history" component={Dashboard} />
      <Route path="/teacher-dashboard" component={Dashboard} />
      <Route path="/review" component={Dashboard} />
      <Route path="/review-submissions" component={Dashboard} />
      <Route path="/grading" component={Dashboard} />
      <Route path="/issue-rewards" component={Dashboard} />
      <Route path="/admin-dashboard" component={Dashboard} />
      <Route path="/manage-contracts" component={Dashboard} />
      <Route path="/assign-teachers" component={Dashboard} />
      <Route path="/batch-operations" component={BatchManagementPage} />
      <Route path="/transactions" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <MetaMaskProvider debug={false} sdkOptions={metaMaskSDKOptions}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </MetaMaskProvider>
  );
}

export default App;
