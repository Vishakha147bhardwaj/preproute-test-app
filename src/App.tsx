import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './app/hooks';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateTest from './pages/CreateTest';
import AddQuestions from './pages/AddQuestions';
import Publish from './pages/Publish';

function App() {
  const token = useAppSelector((state) => state.auth.token);

  return (
    <Routes>
      <Route
        path="/login"
        element={token ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-test"
        element={
          <ProtectedRoute>
            <CreateTest />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-test/:testId/questions"
        element={
          <ProtectedRoute>
            <AddQuestions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-test/:testId/publish"
        element={
          <ProtectedRoute>
            <Publish />
          </ProtectedRoute>
        }
      />
      {/* Root — smart redirect based on auth */}
      <Route
        path="/"
        element={
          token ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;