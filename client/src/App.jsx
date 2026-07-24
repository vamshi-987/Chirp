import React, { useContext, useEffect } from 'react'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login/Login';
import { Route, Routes, useNavigate } from 'react-router-dom';
import Chat from './pages/Chat/Chat';
import ProfileUpdate from './pages/ProfileUpdate/ProfileUpdate';
import Terms from './pages/Legal/Terms';
import Privacy from './pages/Legal/Privacy';
import { AppContext } from './context/AppContext';
import { getToken } from './lib/api';

const App = () => {

  const navigate = useNavigate();
  const { loadUserData, setChatUser, setMessagesId } = useContext(AppContext);

  useEffect(() => {
    // Public routes that don't require being signed in.
    const publicPaths = ['/terms', '/privacy'];
    // Restore the session from a stored JWT, or send the user to login.
    if (getToken()) {
      loadUserData();
    } else {
      setChatUser(null);
      setMessagesId(null);
      if (!publicPaths.includes(window.location.pathname)) navigate('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path='/chat' element={<Chat />} />
        <Route path='/' element={<Login />} />
        <Route path='/profile' element={<ProfileUpdate />} />
        <Route path='/terms' element={<Terms />} />
        <Route path='/privacy' element={<Privacy />} />
      </Routes>
    </>
  )
}

export default App
