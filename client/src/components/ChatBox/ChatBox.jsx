import React, { useContext, useEffect, useRef, useState } from 'react'
import './ChatBox.css'
import assets from '../../assets/assets'
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import upload from '../../lib/upload';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';

const ChatBox = () => {

  const { userData, messagesId, chatUser, messages, setMessages, chatVisible, setChatVisible } = useContext(AppContext);
  const [input, setInput] = useState("");
  const scrollEnd = useRef();

  const fetchMessages = async () => {
    if (!messagesId) return;
    try {
      const res = await api.get(`/messages/${messagesId}`);
      setMessages(res.messages);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const sendMessage = async () => {
    try {
      if (input && messagesId) {
        await api.post(`/messages/${messagesId}`, { text: input });
        setInput("");
        await fetchMessages();
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const convertTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    let hour = date.getHours();
    const minute = String(date.getMinutes()).padStart(2, "0");
    const suffix = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${suffix}`;
  }

  const sendImage = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file || !messagesId) return;
      const fileUrl = await upload(file);
      if (fileUrl) {
        await api.post(`/messages/${messagesId}`, { image: fileUrl });
        await fetchMessages();
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      e.target.value = "";
    }
  }

  useEffect(() => {
    scrollEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages])

  // Load messages when the conversation changes, and refresh on real-time pings.
  useEffect(() => {
    if (!messagesId) return;
    fetchMessages();

    const socket = getSocket();
    const onNew = (payload) => {
      if (payload.messageId === messagesId) fetchMessages();
    };
    if (socket) socket.on("message:new", onNew);

    return () => {
      const s = getSocket();
      if (s) s.off("message:new", onNew);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messagesId]);

  return chatUser ? (
    <div className={`chat-box ${chatVisible ? "" : "hidden"}`}>
      <div className="chat-user">
        <img src={chatUser ? chatUser.userData.avatar : assets.profile_img} alt="" />
        <p>{chatUser ? chatUser.userData.name : "Richard Sanford"} {Date.now() - chatUser.userData.lastSeen <= 70000 ? <img className='dot' src={assets.green_dot} alt='' /> : null}</p>
        <img onClick={()=>setChatVisible(false)} className='arrow' src={assets.arrow_icon} alt="" />
        <img className='help' src={assets.help_icon} alt="" />
      </div>
      <div className="chat-msg">
        <div ref={scrollEnd}></div>
        {
          messages.map((msg, index) => {
            return (
              <div key={index} className={msg.sId === userData.id ? "s-msg" : "r-msg"}>
                {msg["image"]
                  ? <img className='msg-img' src={msg["image"]} alt="" />
                  : <p className="msg">{msg["text"]}</p>
                }
                <div>
                  <img src={msg.sId === userData.id ? userData.avatar : chatUser.userData.avatar} alt="" />
                  <p>{convertTimestamp(msg.createdAt)}</p>
                </div>
              </div>
            )
          })
        }
      </div>
      <div className="chat-input">
        <input onKeyDown={(e) => e.key === "Enter" ? sendMessage() : null} onChange={(e) => setInput(e.target.value)} value={input} type="text" placeholder='Send a message' />
        <input onChange={sendImage} type="file" id='image' accept="image/png, image/jpeg" hidden />
        <label htmlFor="image">
          <img src={assets.gallery_icon} alt="" />
        </label>
        <img onClick={sendMessage} src={assets.send_button} alt="" />
      </div>
    </div>
  ) : <div className={`chat-welcome ${chatVisible ? "" : "hidden"}`}>
    <img src={assets.logo_icon} alt=''/>
    <p>Chat anytime, anywhere</p>
  </div>
}

export default ChatBox
