import React from 'react'
import { Link } from 'react-router-dom'
import './Legal.css'

const Terms = () => {
  return (
    <div className='legal'>
      <div className='legal-card'>
        <h1>Terms of Use</h1>
        <p className='legal-updated'>Last updated: July 23, 2026</p>

        <p>
          Welcome to Chirp. By creating an account or using this chat application
          ("the Service"), you agree to these Terms of Use. Please read them carefully.
        </p>

        <h2>1. Your account</h2>
        <p>
          You must provide a valid email address and keep your login credentials secure.
          You are responsible for all activity that happens under your account.
        </p>

        <h2>2. Acceptable use</h2>
        <ul>
          <li>Do not use the Service to harass, threaten, or abuse other users.</li>
          <li>Do not send spam, unlawful content, or malware through the Service.</li>
          <li>Do not attempt to gain unauthorized access to other accounts or our systems.</li>
        </ul>

        <h2>3. Your content</h2>
        <p>
          You own the messages and images you send. You grant Chirp permission to store
          and transmit that content solely to deliver the Service to you and your recipients.
        </p>

        <h2>4. Availability</h2>
        <p>
          The Service is provided "as is" without warranties of any kind. We may modify,
          suspend, or discontinue features at any time.
        </p>

        <h2>5. Termination</h2>
        <p>
          We may suspend or terminate accounts that violate these terms. You may stop using
          the Service and request deletion of your account at any time.
        </p>

        <h2>6. Changes</h2>
        <p>
          We may update these Terms from time to time. Continued use of the Service after
          changes take effect means you accept the revised Terms.
        </p>

        <Link className='legal-back' to='/'>← Back to sign in</Link>
      </div>
    </div>
  )
}

export default Terms
