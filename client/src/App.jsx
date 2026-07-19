import React, { useContext, useEffect } from 'react'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login/Login';
import { Route, Routes, useNavigate } from 'react-router-dom';
import Chat from './pages/Chat/Chat';
import ProfileUpdate from './pages/ProfileUpdate/ProfileUpdate';
import { AppContext } from './context/AppContext';
import { getToken } from './lib/api';

const App = () => {

  const navigate = useNavigate();
  const { loadUserData, setChatUser, setMessagesId } = useContext(AppContext);

  useEffect(() => {
    // Restore the session from a stored JWT, or send the user to login.
    if (getToken()) {
      loadUserData();
    } else {
      setChatUser(null);
      setMessagesId(null);
      navigate('/');
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
      </Routes>
    </>
  )
}

export default App
