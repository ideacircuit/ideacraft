import {BrowserRouter, Link, Route, Routes} from 'react-router-dom';
import {ErrorBoundary} from './components/ErrorBoundary';
import {Layout} from './components/Layout';
import {StudioProvider} from './context/StudioContext';
import {HomePage} from './pages/HomePage';
import {AboutPage} from './pages/AboutPage';
import {ServicesPage} from './pages/ServicesPage';
import {PortfolioPage} from './pages/PortfolioPage';
import {ContactPage} from './pages/ContactPage';
import {AdminPage} from './pages/AdminPage';

function NotFoundPage() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-10 text-center max-w-2xl mx-auto space-y-6">
      <p className="text-xs font-medium tracking-wide text-[#52524E]">404 · Page Not Found</p>
      <h1 className="font-display text-4xl font-bold tracking-tight text-[#111111]">
        We couldn&apos;t find that page.
      </h1>
      <p className="text-base text-[#52524E]">
        The link may have moved, or the address might be mistyped. Head back to our homepage to continue exploring IdeaCircuit.
      </p>
      <Link
        to="/"
        className="inline-flex items-center justify-center bg-[#B9F53A] hover:bg-[#A8E828] text-[#111111] text-sm font-semibold px-6 py-3 rounded-full transition-colors"
      >
        Return Home
      </Link>
    </section>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <StudioProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/book-call" element={<ContactPage initialMode="call" />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </StudioProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
