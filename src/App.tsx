import { Routes, Route, Navigate } from 'react-router-dom';
import { PocketBaseProvider } from './contexts/PocketBaseContext';
import { AuthProvider } from './contexts/AuthContext';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { CourseDetail } from './pages/CourseDetail';

function App() {
  return (
    <PocketBaseProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/course/:slug" element={<CourseDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </PocketBaseProvider>
  );
}

export default App;
