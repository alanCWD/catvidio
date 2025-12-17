import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Upload from "@/pages/Upload";
import Profile from "@/pages/Profile";
import Leaderboard from "@/pages/Leaderboard";
import ShortsPlayer from "@/pages/ShortsPlayer";
import CreateProfile from "@/pages/CreateProfile";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/upload" component={Upload} />
      <Route path="/profile" component={Profile} />
      <Route path="/create-profile" component={CreateProfile} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/shorts/:id" component={ShortsPlayer} />
      <Route component={NotFound} />
    </Switch>
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
