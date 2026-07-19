import React, { useContext, useEffect, useState } from 'react'
import './ProfileUpdate.css'
import assets from '../../assets/assets'
import { useNavigate } from 'react-router-dom';
import upload from '../../lib/upload';
import { toast } from 'react-toastify';
import { AppContext } from '../../context/AppContext';
import { api, getToken } from '../../lib/api';

const ProfileUpdate = () => {

  const [image, setImage] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const navigate = useNavigate();
  const [prevImage, setPrevImage] = useState("");
  const { userData, setUserData } = useContext(AppContext);

  const profileUpdate = async (event) => {
    event.preventDefault();
    try {
      if (!prevImage && !image) {
        toast.error("Upload profile picture")
        return;
      }
      const update = { name, bio };
      if (image) {
        const imgUrl = await upload(image);
        setPrevImage(imgUrl);
        update.avatar = imgUrl;
      }
      const updated = await api.put("/users/me", update);
      setUserData(updated);
      navigate('/chat')
    } catch (error) {
      console.error(error);
      toast.error(error.message)
    }
  }

  useEffect(() => {
    const load = async () => {
      if (!getToken()) {
        navigate("/");
        return;
      }
      try {
        const user = userData || await api.get("/users/me");
        if (user.name) setName(user.name);
        if (user.bio) setBio(user.bio);
        if (user.avatar) setPrevImage(user.avatar);
      } catch (error) {
        toast.error(error.message);
        navigate("/");
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className='profile'>
      <div className="profile-container">
        <form onSubmit={profileUpdate}>
          <h3>Profile details</h3>
          <label htmlFor='avatar'>
            <input onChange={(e) => setImage(e.target.files[0])} id='avatar' type="file" accept=".png, .jpg, .jpeg" hidden />
            <img src={image ? URL.createObjectURL(image) : assets.avatar_icon} alt="" />
            upload profile image
          </label>
          <input onChange={(e) => setName(e.target.value)} value={name} placeholder='Your name' type="text" required />
          <textarea onChange={(e) => setBio(e.target.value)} value={bio} placeholder='Write profile bio' required />
          <button type="submit">Save</button>
        </form>
        <img className='profile-pic' src={image ? URL.createObjectURL(image) : prevImage ? prevImage : assets.logo_icon} alt="" />
      </div>
    </div>
  )
}

export default ProfileUpdate
