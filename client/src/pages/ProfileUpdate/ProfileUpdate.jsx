import React, { useContext, useEffect, useRef, useState } from 'react'
import './ProfileUpdate.css'
import assets from '../../assets/assets'
import { useNavigate } from 'react-router-dom';
import upload from '../../lib/upload';
import { toast } from 'react-toastify';
import { AppContext } from '../../context/AppContext';
import { api, getToken } from '../../lib/api';
import { logout } from '../../lib/auth';

const ProfileUpdate = () => {

  const [image, setImage] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const navigate = useNavigate();
  const [prevImage, setPrevImage] = useState("");
  const fileInputRef = useRef(null);
  const { userData, setUserData } = useContext(AppContext);

  // Clear the chosen/existing picture so the user can pick a different one.
  // This only affects local state — nothing is saved until "Save" is clicked.
  const clearImage = () => {
    setImage(false);
    setPrevImage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const hasImage = Boolean(image || prevImage);
  const previewSrc = image ? URL.createObjectURL(image) : prevImage ? prevImage : assets.logo_icon;

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
            <input ref={fileInputRef} onChange={(e) => e.target.files[0] && setImage(e.target.files[0])} id='avatar' type="file" accept=".png, .jpg, .jpeg" hidden />
            <span className='avatar-thumb'>
              <img src={image ? URL.createObjectURL(image) : prevImage ? prevImage : assets.avatar_icon} alt="" />
              {hasImage &&
                <button type="button" className='avatar-clear' title='Remove picture'
                  onClick={(e) => { e.preventDefault(); clearImage(); }}>×</button>}
            </span>
            upload profile image
          </label>
          <input onChange={(e) => setName(e.target.value)} value={name} placeholder='Your name' type="text" required />
          <textarea onChange={(e) => setBio(e.target.value)} value={bio} placeholder='Write profile bio' required />
          <button type="submit">Save</button>
          <p className='profile-back'>
            <span onClick={() => logout()}>Back to login</span>
          </p>
        </form>
        <div className='profile-pic-wrap'>
          <img className='profile-pic' src={previewSrc} alt="" />
          {hasImage &&
            <button type="button" className='profile-pic-clear' title='Remove picture' onClick={clearImage}>×</button>}
        </div>
      </div>
    </div>
  )
}

export default ProfileUpdate
