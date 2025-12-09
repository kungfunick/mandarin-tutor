import { AuthProvider } from './contexts/AuthContext';
import { StudyGuideProvider } from './contexts/StudyGuideContext';
import { LoginPage } from './components/LoginPage';
import { useAuth } from './contexts/AuthContext';
import MandarinTutor from './components/MandarinTutor';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🇨🇳</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <StudyGuideProvider>
      <MandarinTutor />
    </StudyGuideProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;