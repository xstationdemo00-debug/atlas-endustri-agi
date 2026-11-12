import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { HashRouter as Router, Route, Routes, Navigate, Link, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ADMIN_ONLY_PATHS } from '@/lib/nav';
import AppShell from '@/components/AppShell';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/Dashboard';
import Projects from '@/pages/Projects';
import ProjectDetail from '@/pages/ProjectDetail';
import WorkRequests from '@/pages/WorkRequests';
import Offers from '@/pages/Offers';
import TeamPool from '@/pages/TeamPool';
import Documents from '@/pages/Documents';
import Companies from '@/pages/Companies';
import Reports from '@/pages/Reports';
import Notifications from '@/pages/Notifications';
import Admin from '@/pages/Admin';
import CommercialServices from '@/pages/CommercialServices';
import SecureServiceInquiry from '@/pages/SecureServiceInquiry';
import FirstPaidService from '@/pages/FirstPaidService';
import SecurityCenter from '@/pages/SecurityCenter';
import PrivacyNotice from '@/pages/PrivacyNotice';
import CommercialDesk from '@/pages/CommercialDesk';
import EfficiencyPilotDesk from '@/pages/EfficiencyPilotDesk';
import FlexibleEarnings from '@/pages/FlexibleEarnings';
import FlexibleWorkPilotDesk from '@/pages/FlexibleWorkPilotDesk';
import IndustrialMatching from '@/pages/IndustrialMatching';
import VerifiedNetwork from '@/pages/VerifiedNetwork';
import IndustryAssistant from '@/components/IndustryAssistant';
import ProjectLifecycle from '@/pages/ProjectLifecycle';
import ProjectSolutions from '@/pages/ProjectSolutions';
import SupportHub from '@/pages/SupportHub';
import SupportDesk from '@/pages/SupportDesk';
import HowItWorks from '@/pages/HowItWorks';
import LegalReadiness from '@/pages/LegalReadiness';
import TenderBoard from '@/pages/TenderBoard';
import TenderModeration from '@/pages/TenderModeration';
import TenderAnalysisEngine from '@/pages/TenderAnalysisEngine';
import TenderAlerts from '@/pages/TenderAlerts';
import WorkerRights from '@/pages/WorkerRights';
import WorkerProtectionDesk from '@/pages/WorkerProtectionDesk';
import WhatsAppSetup from '@/pages/WhatsAppSetup';
import CompanyOnboarding from '@/pages/CompanyOnboarding';
import CompanyVerification from '@/pages/CompanyVerification';
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user } = useAuth();
  const location = useLocation();
  // Public B2B service page is accessible before registration or sign-in.
  if (location.pathname === '/hizmetler') return (
    <div className="atlas-marketing-verification">
      <style>{`#teklif form {display:none!important;}`}</style>
      <div className="sticky top-0 z-40 flex flex-wrap items-center justify-center gap-3 border-b border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-950 shadow-sm">
        <span className="font-semibold">Pilot tedarikçi araştırması: ilk temas için üyelik gerekmez.</span>
        <Link to="/ilk-hizmet#dogrudan-talep" className="rounded-md bg-slate-950 px-3 py-2 font-bold text-white">Üyelik olmadan ön talep gönder</Link>
        {user?.email ? (
          <Link to="/guvenli-talep" className="rounded-md border border-amber-700 px-3 py-2 font-bold">Girişli güvenli talep</Link>
        ) : (
          <Link to="/login?returnTo=%2Fguvenli-talep" className="rounded-md border border-amber-700 px-3 py-2 font-bold">Giriş yap</Link>
        )}
      </div>
      <CommercialServices />
    </div>
  );
  if (location.pathname === '/ilk-hizmet') return <FirstPaidService />;
  if (location.pathname === '/gizlilik') return <PrivacyNotice />;
  if (location.pathname === '/cozumler') return <ProjectSolutions />;
  if (location.pathname === '/destek') return <SupportHub />;
  if (location.pathname === '/nasil-calisir') return <HowItWorks />;
  if (location.pathname === '/ihaleler') return <TenderBoard />;
  if (location.pathname === '/calisan-haklari') return <WorkerRights />;
  if (location.pathname === '/esnek-kazanc') return <FlexibleEarnings />;

  // UX gate only: backend auth + entity RLS must independently enforce permissions.
  if (ADMIN_ONLY_PATHS.includes(location.pathname) &&
    !isLoadingPublicSettings && !isLoadingAuth && user?.role !== 'admin') {
    return <Navigate to={user ? '/' : '/login'} replace />;
  }

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Public conversion: send first-time visitors to the service offer rather than a login wall.
  // Signed-in users still enter their normal dashboard at '/'.
  if (location.pathname === '/' && !user?.id) {
    return <Navigate to="/ilk-hizmet" replace />;
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projeler" element={<Projects />} />
          <Route path="/guvenli-talep" element={<SecureServiceInquiry />} />
          <Route path="/guvenlik-merkezi" element={<SecurityCenter />} />
          <Route path="/projeler/:id" element={<ProjectDetail />} />
          <Route path="/is-talepleri" element={<WorkRequests />} />
          <Route path="/teklifler" element={<Offers />} />
          <Route path="/ekip-havuzu" element={<TeamPool />} />
          <Route path="/belgeler" element={<Documents />} />
          <Route path="/firmalar" element={<Companies />} />
          <Route path="/firma-kayit" element={<CompanyOnboarding />} />
          <Route path="/firma-dogrulama" element={<CompanyVerification />} />
          <Route path="/eslestirme" element={<IndustrialMatching />} />
          <Route path="/dogrulanmis-ag" element={<VerifiedNetwork />} />
          <Route path="/ticari-talepler" element={<CommercialDesk />} />
          <Route path="/verimlilik-pilotu" element={<EfficiencyPilotDesk />} />
          <Route path="/esnek-gorev-pilotu" element={<FlexibleWorkPilotDesk />} />
          <Route path="/proje-merkezi" element={<ProjectLifecycle />} />
          <Route path="/destek-merkezi" element={<SupportDesk />} />
          <Route path="/lansman-hazirlik" element={<LegalReadiness />} />
          <Route path="/ihale-yayinlari" element={<TenderModeration />} />
          <Route path="/ihale-analizi" element={<TenderAnalysisEngine />} />
          <Route path="/ihale-bildirimleri" element={<TenderAlerts />} />
          <Route path="/calisan-koruma" element={<WorkerProtectionDesk />} />
          <Route path="/whatsapp-kurulum" element={<WhatsAppSetup />} />
          <Route path="/raporlar" element={<Reports />} />
          <Route path="/bildirimler" element={<Notifications />} />
          <Route path="/yonetim" element={<Admin />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
          <IndustryAssistant />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App