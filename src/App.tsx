import { AuthProvider, useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import Header from './components/Header';
import SubmitterView from './components/SubmitterView';
import HandlerView from './components/HandlerView';

function AppContent() {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {userRole === 'handler' ? <HandlerView /> : <SubmitterView />}
    </div>
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
