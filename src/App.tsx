import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Abstracts from "./pages/Abstracts";
import NewAbstract from "./pages/NewAbstract";
import EditAbstract from "./pages/EditAbstract";
import EventLanding from "./pages/EventLanding";
import Review from "./pages/Review";
import Committee from "./pages/Committee";
import Events from "./pages/Events";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import ProgramManager from "./pages/ProgramManager";
import MyProgram from "./pages/MyProgram";
import NotFound from "./pages/NotFound";
// CMS Imports
import CMSPagesManager from "./pages/CMSPagesManager";
import CMSArticlesManager from "./pages/CMSArticlesManager";
import CMSMenuManager from "./pages/CMSMenuManager";
import CMSWidgetsManager from "./pages/CMSWidgetsManager";
import SuperAdminPanel from "./pages/SuperAdminPanel";
// Public CMS Pages
import PublicPage from "./pages/PublicPage";
import PublicArticle from "./pages/PublicArticle";
import PublicBlog from "./pages/PublicBlog";
import PublicCategory from "./pages/PublicCategory";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/abstracts" element={<Abstracts />} />
            <Route path="/abstracts/new" element={<NewAbstract />} />
            <Route path="/abstracts/edit/:abstractId" element={<EditAbstract />} />
            <Route path="/event/:eventId" element={<EventLanding />} />
            <Route path="/review" element={<Review />} />
            <Route path="/committee" element={<Committee />} />
            <Route path="/events" element={<Events />} />
            <Route path="/users" element={<Users />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/program" element={<ProgramManager />} />
            <Route path="/my-program" element={<MyProgram />} />
            
            {/* CMS Routes */}
            <Route path="/cms/pages" element={<CMSPagesManager />} />
            <Route path="/cms/articles" element={<CMSArticlesManager />} />
            <Route path="/cms/menus" element={<CMSMenuManager />} />
            <Route path="/cms/widgets" element={<CMSWidgetsManager />} />
            <Route path="/superadmin" element={<SuperAdminPanel />} />
            
            {/* Public CMS Routes */}
            <Route path="/pagina/:slug" element={<PublicPage />} />
            <Route path="/articulo/:slug" element={<PublicArticle />} />
            <Route path="/blog" element={<PublicBlog />} />
            <Route path="/categoria/:slug" element={<PublicCategory />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ScrollToTop />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
