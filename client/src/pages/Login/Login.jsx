import React, { useContext, useState } from 'react'
import './Login.css'
import assets from '../../assets/assets';
import { signup, login, verifyOtp, resetPass, resetPasswordConfirm } from '../../lib/auth';
import { AppContext } from '../../context/AppContext';

const Login = () => {

  // Modes: "Sign up" | "Login" | "Verify" | "Forgot" | "Reset"
  const [currState, setCurrState] = useState("Sign up");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const { loadUserData } = useContext(AppContext);

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      if (currState === "Sign up") {
        const result = await signup(userName, email, password);
        if (result?.loggedIn) {
          await loadUserData();
        } else if (result?.email) {
          setEmail(result.email);
          setCurrState("Verify");
        }
      } else if (currState === "Verify") {
        const ok = await verifyOtp(email, otp);
        if (ok) await loadUserData();
      } else if (currState === "Login") {
        const ok = await login(email, password);
        if (ok) await loadUserData();
      } else if (currState === "Forgot") {
        const ok = await resetPass(email);
        if (ok) setCurrState("Reset");
      } else if (currState === "Reset") {
        const ok = await resetPasswordConfirm(email, otp, password);
        if (ok) {
          setPassword("");
          setOtp("");
          setCurrState("Login");
        }
      }
    } finally {
      setLoading(false);
    }
  }

  const heading = currState === "Verify" ? "Verify email"
    : currState === "Forgot" ? "Forgot password"
    : currState === "Reset" ? "Reset password"
    : currState;

  const buttonLabel = currState === "Sign up" ? "Create account"
    : currState === "Verify" ? "Verify code"
    : currState === "Forgot" ? "Send reset code"
    : currState === "Reset" ? "Update password"
    : "Login now";

  return (
    <div className='login'>
      <img className='logo' src={assets.logo_big} alt="" />
      <form onSubmit={onSubmitHandler} className='login-form' >
        <h2>{heading}</h2>

        {currState === "Sign up" &&
          <input onChange={(e) => setUserName(e.target.value)} value={userName} className='form-input' type="text" placeholder='username' required />}

        {(currState === "Sign up" || currState === "Login" || currState === "Forgot") &&
          <input onChange={(e) => setEmail(e.target.value)} value={email} className='form-input' type="email" placeholder='Email address' required />}

        {(currState === "Verify" || currState === "Reset") &&
          <>
            <p className='login-toggle'>Enter the 6-digit code sent to <b>{email}</b></p>
            <input onChange={(e) => setOtp(e.target.value)} value={otp} className='form-input' type="text" inputMode='numeric' maxLength={6} placeholder='Verification code' required />
          </>}

        {(currState === "Sign up" || currState === "Login" || currState === "Reset") &&
          <input onChange={(e) => setPassword(e.target.value)} value={password} className='form-input' type="password" placeholder={currState === "Reset" ? "New password" : "password"} required />}

        <button type='submit' disabled={loading}>{loading ? "Please wait..." : buttonLabel}</button>

        {currState === "Sign up" &&
          <div className='login-term'>
            <input type="checkbox" />
            <p>Agree to the terms of use & privacy policy.</p>
          </div>}

        <div className='login-forgot'>
          {currState === "Sign up" &&
            <p className='login-toggle'>Already have an account? <span onClick={() => setCurrState("Login")}>Login here</span></p>}
          {currState === "Login" &&
            <>
              <p className='login-toggle'>Create an account <span onClick={() => setCurrState("Sign up")}>Click here</span></p>
              <p className='login-toggle'>Forgot Password ? <span onClick={() => setCurrState("Forgot")}>Click here</span></p>
            </>}
          {(currState === "Verify" || currState === "Forgot" || currState === "Reset") &&
            <p className='login-toggle'>Back to <span onClick={() => setCurrState("Login")}>Login</span></p>}
        </div>
      </form>
    </div>
  )
}

export default Login
