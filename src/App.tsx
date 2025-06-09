import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Feed from './pages/Feed';
import PetProfile from './pages/PetProfile';
import UserProfile from './pages/UserProfile';
import OwnerProfile from './pages/OwnerProfile';
import CreatePet from './pages/CreatePet';
import CreatePost from './pages/CreatePost';
import EditProfile from './pages/EditProfile';
import EditPet from './pages/EditPet';
import EditPost from './pages/EditPost';
import PostDetail from './pages/PostDetail';
import NotFound from './pages/NotFound';
import Messages from './pages/Messages';
import Favorites from './pages/Favorites';
import Friends from './pages/Friends';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import CreateEvent from './pages/CreateEvent';
import EditEvent from './pages/EditEvent';
import LoadingScreen from './components/common/LoadingScreen';

// Wrapper component for auth routes that handles redirection
function AuthRouteWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { initialized, user, initializeAuth } = useAuthStore();

  console.log('🔍 App component rendering, user:', user?.username, 'initialized:', initialized);
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (!initialized) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      {console.log('🔍 Router rendering with routes')}
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route 
            path="/signin" 
            element={
              <AuthRouteWrapper>
                <SignIn />
              </AuthRouteWrapper>
            } 
          />
          <Route 
            path="/signup" 
            element={
              <AuthRouteWrapper>
                <SignUp />
              </AuthRouteWrapper>
            } 
          />
        </Route>

        {/* Protected routes */}
        <Route 
          element={user ? <MainLayout /> : <Navigate to="/signin" />}
        >
          <Route path="/" element={<Feed />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/create" element={<CreateEvent />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/events/:id/edit" element={<EditEvent />} />
          <Route path="/pets/create" element={<CreatePet />} />
          <Route path="/pets/:id" element={<PetProfile />} />
          <Route path="/pets/:id/edit" element={<EditPet />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/users/:id" element={<OwnerProfile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/create-post" element={<CreatePost />} />
          <Route path="/posts/:id/edit" element={<EditPost />} />
          <Route path="/posts/:id" element={<PostDetail />} />
          <Route path="/messages" element={<Messages />} />
        </Route>

        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;