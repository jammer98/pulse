import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import AuthPage from './pages/AuthPage';
import InboxPage from './pages/InboxPage';
import PreferencesPage from './pages/PreferencesPage';
import DemoPage from './pages/DemoPage';

export default function App() {
  return <BrowserRouter><AuthProvider><SocketProvider><Routes><Route path="/login" element={<AuthPage mode="login" />} /><Route path="/register" element={<AuthPage mode="register" />} /><Route element={<ProtectedRoute><Layout /></ProtectedRoute>}><Route path="/" element={<InboxPage />} /><Route path="/preferences" element={<PreferencesPage />} /><Route path="/demo" element={<DemoPage />} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes></SocketProvider></AuthProvider></BrowserRouter>;
}
