import React from 'react'
import { Link } from 'react-router-dom'
import './Legal.css'

const Privacy = () => {
  return (
    <div className='legal'>
      <div className='legal-card'>
        <h1>Privacy Policy</h1>
        <p className='legal-updated'>Last updated: July 23, 2026</p>

        <p>
          This Privacy Policy explains what information Chirp ("we") collects, how we use it,
          and the choices you have. By using the Service you agree to this policy.
        </p>

        <h2>1. Information we collect</h2>
        <ul>
          <li><b>Account data:</b> your username, email address, and a securely hashed password.</li>
          <li><b>Profile data:</b> an optional display name, bio, and avatar image.</li>
          <li><b>Messages:</b> the text and images you exchange with other users.</li>
          <li><b>Usage data:</b> basic activity such as your last-seen time.</li>
        </ul>

        <h2>2. How we use your information</h2>
        <p>
          We use your information to authenticate you, deliver messages, show your online
          status, and operate and improve the Service. We do not sell your personal data.
        </p>

        <h2>3. Email verification</h2>
        <p>
          We send a one-time verification code to your email address during signup and
          password reset. These codes are short-lived and used only to confirm ownership
          of the email address.
        </p>

        <h2>4. Data storage</h2>
        <p>
          Account and message data is stored in our database, and images are stored with our
          media provider. We apply reasonable safeguards to protect your data, but no method
          of transmission or storage is completely secure.
        </p>

        <h2>5. Your choices</h2>
        <p>
          You can update your profile at any time and delete conversations from your own view.
          You may request deletion of your account by contacting us.
        </p>

        <h2>6. Changes</h2>
        <p>
          We may update this policy from time to time. We will revise the "Last updated" date
          above when we do.
        </p>

        <Link className='legal-back' to='/'>← Back to sign in</Link>
      </div>
    </div>
  )
}

export default Privacy
