import React, { useContext, useState } from 'react'
import './LeftSidebar.css'
import assets from '../../assets/assets'
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import { logout } from '../../lib/auth';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';

const LeftSidebar = () => {

    const { chatData, userData, setChatUser, setMessagesId, messagesId, chatVisible, setChatVisible, fetchChats } = useContext(AppContext);
    const [user, setUser] = useState(null);
    const [showSearch, setShowSearch] = useState(false)
    const navigate = useNavigate();

    const inputHandler = async (e) => {
        try {
            const input = e.target.value;
            if (!input) {
                setShowSearch(false);
                setUser(null);
                return;
            }
            setShowSearch(true);
            const res = await api.get(`/users/search?username=${encodeURIComponent(input)}`);
            const found = res.user;
            // Only offer to start a chat if the user exists and isn't already in the list.
            if (found && !(chatData || []).some((c) => c.rId === found.id)) {
                setUser(found);
            } else {
                setUser(null);
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const addChat = async () => {
        if (!user || user.id === userData.id) return;
        try {
            const res = await api.post("/chats", { rId: user.id });
            const chat = res.chat;
            setMessagesId(chat.messageId);
            setChatUser(chat);
            await fetchChats();
            setUser(null);
            setShowSearch(false);
            setChatVisible(true);
        } catch (error) {
            toast.error(error.message)
        }
    }

    const setChat = async (item) => {
        setMessagesId(item.messageId)
        setChatUser(item)
        try {
            await api.post("/chats/seen", { messageId: item.messageId });
            await fetchChats();
        } catch (error) {
            toast.error(error.message)
        }
        setChatVisible(true)
    }

    return (
        <div className={`ls ${chatVisible ? "hidden" : ""}`}>
            <div className='ls-top'>
                <div className='ls-nav'>
                    <img className='logo' src={assets.logo} alt="" />
                    <div className='menu'>
                        <img src={assets.menu_icon} alt="" />
                        <div className='sub-menu'>
                            <p onClick={() => navigate('/profile')}>Edit Profile</p>
                            <hr />
                            <p onClick={() => logout()}>Logout</p>
                        </div>
                    </div>
                </div>
                <div className="ls-search">
                    <img src={assets.search_icon} alt="" />
                    <input onChange={inputHandler} type="text" placeholder='Search here..' />
                </div>
            </div>
            <div className="ls-list">
                {showSearch && user
                    ? <div onClick={addChat} className='friends add-user'>
                        <img src={user.avatar} alt="" />
                        <p>{user.name || user.username}</p>
                    </div>
                    : (chatData || []).map((item, index) => (
                        <div onClick={() => setChat(item)} key={index} className={`friends ${item.messageSeen || item.messageId === messagesId ? "" : "border"}`}>
                            <img src={item.userData.avatar} alt="" />
                            <div>
                                <p>{item.userData.name}</p>
                                <span>{item.lastMessage.slice(0, 30)}</span>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    )
}

export default LeftSidebar
