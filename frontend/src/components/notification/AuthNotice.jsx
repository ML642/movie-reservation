import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import './AuthNotice.css';

const noticeMeta = {
  success: {
    icon: <FaCheckCircle />,
    title: 'Success',
  },
  error: {
    icon: <FaExclamationTriangle />,
    title: 'Something went wrong',
  },
  info: {
    icon: <FaInfoCircle />,
    title: 'Notice',
  },
};

const AuthNotice = ({ notice, onClose }) => {
  if (!notice?.message) return null;

  const type = notice.type || 'info';
  const meta = noticeMeta[type] || noticeMeta.info;

  return (
    <div className={`auth-notice auth-notice-${type}`} role="status" aria-live="polite">
      <div className="auth-notice-icon">{meta.icon}</div>
      <div className="auth-notice-copy">
        <strong>{notice.title || meta.title}</strong>
        <span>{notice.message}</span>
      </div>
      <button type="button" className="auth-notice-close" onClick={onClose} aria-label="Close notification">
        <FaTimes />
      </button>
    </div>
  );
};

export default AuthNotice;
