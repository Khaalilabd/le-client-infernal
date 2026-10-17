// Routes de l'application. Les routes des modules sont déclarées dans
// src/modules/<module>/routes.jsx et rassemblées dans src/modules/index.js.
import { Route, Routes } from 'react-router-dom';
import Layout from './shared/layout/Layout.jsx';
import ProtectedRoute from './shared/auth/ProtectedRoute.jsx';
import LoginPage from './shared/pages/LoginPage.jsx';
import RegisterPage from './shared/pages/RegisterPage.jsx';
import HomePage from './shared/pages/HomePage.jsx';
import NotFoundPage from './shared/pages/NotFoundPage.jsx';
import { modules } from './modules/index.js';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          {modules.map((module) => (
            <Route key={module.id} path={module.path} element={<ProtectedRoute roles={module.roles} />}>
              {module.routes.map((route) => (
                <Route key={route.path || 'index'} index={!route.path} path={route.path || undefined} element={route.element} />
              ))}
            </Route>
          ))}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
