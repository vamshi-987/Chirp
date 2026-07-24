import { createContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { api, getToken, clearToken } from "../lib/api";
import { connectSocket, getSocket } from "../lib/socket";

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const [userData, setUserData] = useState(null);
  const [chatData, setChatData] = useState(null);
  const [messagesId, setMessagesId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatUser, setChatUser] = useState(null);
  const [chatVisible, setChatVisible] = useState(false);
  const navigate = useNavigate();

  // Latest chatUser id, so socket/interval callbacks can read it without re-subscribing.
  const chatUserRef = useRef(null);
  useEffect(() => {
    chatUserRef.current = chatUser?.userData?.id || null;
  }, [chatUser]);

  const fetchChats = async () => {
    try {
      const res = await api.get("/chats");
      const list = res.chatsData || [];
      setChatData(list);
      // Keep the open conversation's header (name/avatar/online dot) fresh.
      const openId = chatUserRef.current;
      if (openId) {
        const match = list.find((c) => c.rId === openId);
        if (match) setChatUser((prev) => (prev ? { ...prev, userData: match.userData } : prev));
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Load the signed-in user and route to chat or profile setup.
  const loadUserData = async () => {
    try {
      const user = await api.get("/users/me");
      setUserData(user);
      if (user.avatar && user.name) navigate("/chat");
      else navigate("/profile");
      return user;
    } catch (error) {
      // Stale/invalid session (e.g. a token pointing at a user that no longer
      // exists): clear it and return to login instead of looping on the error.
      if (error.status === 401 || error.status === 404) {
        clearToken();
        navigate("/");
        return null;
      }
      toast.error(error.message);
      return null;
    }
  };

  // Once we have a user: connect the socket, load chats, subscribe to updates,
  // and keep lastSeen fresh. All of this is torn down on logout / user change.
  useEffect(() => {
    if (!userData) return;
    if (!getToken()) return;

    const socket = connectSocket();
    fetchChats();

    if (socket) socket.on("chats:update", fetchChats);

    const heartbeat = setInterval(() => {
      api.post("/users/lastseen").catch(() => {});
    }, 60000);

    // Poll the chat list so other users' online dot / lastSeen stay fresh even
    // when no messages are flowing (socket only fires on message activity).
    const chatPoll = setInterval(fetchChats, 10000);

    return () => {
      const s = getSocket();
      if (s) s.off("chats:update", fetchChats);
      clearInterval(heartbeat);
      clearInterval(chatPoll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.id]);

  const value = {
    userData, setUserData,
    loadUserData,
    chatData, setChatData,
    fetchChats,
    messagesId, setMessagesId,
    chatUser, setChatUser,
    chatVisible, setChatVisible,
    messages, setMessages,
  };

  return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
};

export default AppContextProvider;
