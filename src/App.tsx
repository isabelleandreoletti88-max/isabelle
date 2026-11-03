import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import SEO from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { HomePage, CreationDetailPage, PersonalisationPage, AboutPage, ContactPage, NotFoundPage } from '@/pages';
import { BoutiquePage } from '@/pages/BoutiquePage';
import { EventsPage } from '@/pages/EventsPage';
// L'administration et les pages légales sont chargées à la demande : le site public reste léger.
const legal = () => import('@/legalPages');
const admin = () => import('@/admin');
const LegalHubPage = lazy(() => legal().then((m) => ({ default: m.LegalHubPage })));
const LegalNoticePage = lazy(() => legal().then((m) => ({ default: m.LegalNoticePage })));
const PrivacyPolicyPage = lazy(() => legal().then((m) => ({ default: m.PrivacyPolicyPage })));
const CookiesPolicyPage = lazy(() => legal().then((m) => ({ default: m.CookiesPolicyPage })));
const CookieManagementPage = lazy(() => legal().then((m) => ({ default: m.CookieManagementPage })));
const TermsOfUsePage = lazy(() => legal().then((m) => ({ default: m.TermsOfUsePage })));
const MediationPage = lazy(() => legal().then((m) => ({ default: m.MediationPage })));
const CommercialInfoPage = lazy(() => legal().then((m) => ({ default: m.CommercialInfoPage })));
const CgvPage = lazy(() => legal().then((m) => ({ default: m.CgvPage })));
const ShippingPage = lazy(() => legal().then((m) => ({ default: m.ShippingPage })));
const ReturnsPage = lazy(() => legal().then((m) => ({ default: m.ReturnsPage })));
const WithdrawalPage = lazy(() => legal().then((m) => ({ default: m.WithdrawalPage })));
const WithdrawalFormPage = lazy(() => legal().then((m) => ({ default: m.WithdrawalFormPage })));
const AdminLogin = lazy(() => admin().then((m) => ({ default: m.AdminLogin })));
const AdminLayout = lazy(() => admin().then((m) => ({ default: m.AdminLayout })));
const ProtectedRoute = lazy(() => admin().then((m) => ({ default: m.ProtectedRoute })));
const AdminDashboard = lazy(() => admin().then((m) => ({ default: m.AdminDashboard })));
const AdminProducts = lazy(() => admin().then((m) => ({ default: m.AdminProducts })));
const AdminProductForm = lazy(() => admin().then((m) => ({ default: m.AdminProductForm })));
const AdminRequests = lazy(() => admin().then((m) => ({ default: m.AdminRequests })));
const AdminSimplePage = lazy(() => admin().then((m) => ({ default: m.AdminSimplePage })));
const AdminLegal = lazy(() => admin().then((m) => ({ default: m.AdminLegal })));
const AdminHeroSlides = lazy(() => admin().then((m) => ({ default: m.AdminHeroSlides })));
const AdminSiteImages = lazy(() => admin().then((m) => ({ default: m.AdminSiteImages })));
const AdminEvents = lazy(() => admin().then((m) => ({ default: m.AdminEvents })));
const adminPages = () => import('@/adminPages');
const AdminSettings = lazy(() => adminPages().then((m) => ({ default: m.AdminSettings })));
const AdminTexts = lazy(() => adminPages().then((m) => ({ default: m.AdminTexts })));
const AdminMaterials = lazy(() => adminPages().then((m) => ({ default: m.AdminMaterials })));

function AdminNoIndex() {
  return <><SEO title="Administration | L'Atelier d'Isabelle" noindex /><Outlet /></>;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [pathname]);
  return null;
}

function SiteLayout() {
  return <><ScrollToTop /><Header /><Outlet /><Footer /><a href="/contact" className="lg:hidden fixed bottom-4 right-4 z-40 btn-primary shadow-card text-sm">Contacter Isabelle</a></>;
}

function App() {
  return <BrowserRouter><Suspense fallback={<div className="min-h-screen bg-cream" />}><Routes>
    <Route element={<AdminNoIndex />}>
    <Route path="/admin/login" element={<AdminLogin />} />
    <Route element={<ProtectedRoute />}><Route element={<AdminLayout />}>
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/creations" element={<AdminProducts />} />
      <Route path="/admin/creations/nouvelle" element={<AdminProductForm />} />
      <Route path="/admin/creations/:id" element={<AdminProductForm />} />
      <Route path="/admin/categories" element={<AdminSimplePage title="Catégories" kind="categories" />} />
      <Route path="/admin/saisons" element={<AdminSimplePage title="Saisons" kind="seasons" />} />
      <Route path="/admin/hero" element={<AdminHeroSlides />} />
      <Route path="/admin/evenements" element={<AdminEvents />} />
      <Route path="/admin/images" element={<AdminSiteImages />} />
      <Route path="/admin/contenus" element={<AdminTexts />} />
      <Route path="/admin/matieres" element={<AdminMaterials />} />
      <Route path="/admin/medias" element={<AdminSimplePage title="Médiathèque" kind="medias" />} />
      <Route path="/admin/demandes" element={<AdminRequests />} />
      <Route path="/admin/legal" element={<AdminLegal />} />
      <Route path="/admin/parametres" element={<AdminSettings />} />
    </Route></Route>
    </Route>
    <Route element={<SiteLayout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/boutique" element={<BoutiquePage />} />
      <Route path="/creations" element={<BoutiquePage />} />
      <Route path="/creations/:slug" element={<CreationDetailPage />} />
      <Route path="/collections" element={<BoutiquePage />} />
      <Route path="/collections/:slug" element={<BoutiquePage />} />
      <Route path="/evenements" element={<EventsPage />} />
      <Route path="/personnalisation" element={<PersonalisationPage />} />
      <Route path="/a-propos" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/favoris" element={<NotFoundPage />} />
      <Route path="/panier" element={<NotFoundPage />} />
      <Route path="/informations-legales" element={<LegalHubPage />} />
      <Route path="/mentions-legales" element={<LegalNoticePage />} />
      <Route path="/politique-confidentialite" element={<PrivacyPolicyPage />} />
      <Route path="/confidentialite" element={<PrivacyPolicyPage />} />
      <Route path="/cookies" element={<CookiesPolicyPage />} />
      <Route path="/gestion-des-cookies" element={<CookieManagementPage />} />
      <Route path="/conditions-utilisation" element={<TermsOfUsePage />} />
      <Route path="/mediation-consommation" element={<MediationPage />} />
      <Route path="/informations-commerciales" element={<CommercialInfoPage />} />
      <Route path="/conditions-generales-de-vente" element={<CgvPage />} />
      <Route path="/livraison" element={<ShippingPage />} />
      <Route path="/retours-remboursements" element={<ReturnsPage />} />
      <Route path="/droit-de-retractation" element={<WithdrawalPage />} />
      <Route path="/formulaire-retractation" element={<WithdrawalFormPage />} />
      <Route path="/mentions-legales-legacy" element={<LegalNoticePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes></Suspense></BrowserRouter>;
}

export default App;
