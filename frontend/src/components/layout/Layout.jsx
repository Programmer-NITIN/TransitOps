import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <Topbar />
      <main className="page-container">
        {children || <Outlet />}
      </main>
    </div>
  );
}
