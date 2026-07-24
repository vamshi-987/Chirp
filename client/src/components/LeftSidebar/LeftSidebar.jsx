import React, { useContext, useState } from 'react'
import './LeftSidebar.css'
import assets from '../../assets/assets'
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import { logout, deleteAccount } from '../../lib/auth';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';

const LeftSidebar = () => {

    const { chatData, userData, setChatUser, setMessagesId, messagesId, chatVisible, setChatVisible, fetchChats } = useContext(AppContext);
    const [user, setUser] = useState(null);
    const [showSearch, setShowSearch] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const navigate = useNavigate();

    // Run the account deletion once the user confirms in the modal.
    const confirmDeleteAccount = async () => {
        if (deleting) return;
        setDeleting(true);
        const ok = await deleteAccount();
        // On success deleteAccount redirects away; only reset state on failure.
        if (!ok) {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

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

    // Delete a conversation for the current user only. The other participant
    // keeps the conversation unless they delete it on their side too.
    const deleteChat = async (e, item) => {
        e.stopPropagation();
        if (!window.confirm("Delete this conversation? It will only be removed for you.")) return;
        try {
            await api.delete(`/chats/${item.messageId}`);
            // If the deleted conversation is the one open, clear the chat view.
            if (item.messageId === messagesId) {
                setMessagesId(null);
                setChatUser(null);
                setChatVisible(false);
            }
            await fetchChats();
        } catch (error) {
            toast.error(error.message);
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
                            <hr />
                            <p className='menu-danger' onClick={() => setShowDeleteConfirm(true)}>Delete Account</p>
                        </div>
                    </div>
                </div>
                <label className="ls-search">
                    <img src={assets.search_icon} alt="" />
                    <input onChange={inputHandler} type="text" placeholder='Search here..' />
                </label>
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
                            <button
                                className='delete-chat'
                                title='Delete conversation'
                                onClick={(e) => deleteChat(e, item)}
                            >✕</button>
                        </div>
                    ))}
            </div>

            {showDeleteConfirm &&
                <div className='confirm-overlay' onClick={() => !deleting && setShowDeleteConfirm(false)}>
                    <div className='confirm-box' onClick={(e) => e.stopPropagation()}>
                        <h3>Delete account?</h3>
                        <p>This permanently removes your profile and all your conversations. This action cannot be undone.</p>
                        <div className='confirm-actions'>
                            <button className='confirm-cancel' disabled={deleting} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                            <button className='confirm-delete' disabled={deleting} onClick={confirmDeleteAccount}>
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>}
        </div>
    )
}

export default LeftSidebar
