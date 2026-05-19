import { Outlet } from 'react-router-dom';

// MainLayout wraps all main app pages.
// Add Navbar, sidebar, or footer here when needed — pages stay untouched.
export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar goes here when added:  <Navbar /> */}
      <Outlet />
    </div>
  );
}
