import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { HomePage, CreationsPage, CreationDetailPage, PersonalisationPage, AboutPage, ContactPage, NotFoundPage } from '@/pages';
import { BoutiquePage } from '@/pages/BoutiquePage';
import { EventsPage } from '@/pages/EventsPage';
import { LegalHubPage, LegalNoticePage, PrivacyPolicyPage, CookiesPolicyPage, CookieManagementPage, TermsOfUsePage, MediationPage, CommercialInfoPage, CgvPage, ShippingPage, ReturnsPage, WithdrawalPage, WithdrawalFormPage } from '@/legalPages';
import { AdminLogin, AdminLayout, ProtectedRoute, AdminDashboard, AdminProducts, AdminProductForm, AdminRequests, AdminSimplePage, AdminLegal, AdminHeroSlides, AdminSiteImages, AdminEvents } from '@/admin';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [pathname]);
  return null;
}

function SiteLayout() {
  return <><ScrollToTop /><Header /><Outlet /><Footer /><a href="/contact" className="lg:hidden fixed bottom-4 right-4 z-40 btn-primary shadow-card text-sm">Contacter Isabelle</a></>;
}

function App() {
  return <BrowserRouter><Routes>
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
      <Route path="/admin/contenus" element={<AdminSimplePage title="Contenus du site" kind="contents" />} />
      <Route path="/admin/medias" element={<AdminSimplePage title="Médiathèque" kind="medias" />} />
      <Route path="/admin/demandes" element={<AdminRequests />} />
      <Route path="/admin/legal" element={<AdminLegal />} />
      <Route path="/admin/parametres" element={<AdminSimplePage title="Paramètres" kind="settings" />} />
    </Route></Route>
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
  </Routes></BrowserRouter>;
}

export default App;
