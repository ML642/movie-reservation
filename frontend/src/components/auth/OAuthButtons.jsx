import { FaGithub, FaGoogle } from 'react-icons/fa';
import './OAuthButtons.css';

const OAuthButtons = ({ onSelect, mode = 'login' }) => (
  <div className="oauth-auth">
    <div className="oauth-divider">
      <span>{mode === 'register' ? 'or sign up with' : 'or continue with'}</span>
    </div>
    <div className="oauth-buttons">
      <button type="button" className="oauth-button oauth-google" onClick={() => onSelect('google')}>
        <FaGoogle aria-hidden="true" /> Continue with Google
      </button>
      <button type="button" className="oauth-button oauth-github" onClick={() => onSelect('github')}>
        <FaGithub aria-hidden="true" /> Continue with GitHub
      </button>
    </div>
  </div>
);

export default OAuthButtons;
