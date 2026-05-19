import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import EditorPage from './pages/EditorPage';
import DiagramPage from './pages/DiagramPage';
import DocumentPage from './pages/DocumentPage';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/generate" element={<DiagramPage />} />
        <Route path="/document" element={<DocumentPage />} />
        <Route path="/editor" element={<EditorPage />} />
      </Route>
      <Route path="/diagram" element={<DiagramPage />} />
    </Routes>
  );
}