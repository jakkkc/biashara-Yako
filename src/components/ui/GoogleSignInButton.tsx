import React from 'react';

interface GoogleSignInButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ onClick, disabled }) => {
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className="btn-google w-full"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.642 10.231c0-.683-.062-1.341-.176-1.97H10v3.727h5.41c-.234 1.258-.942 2.324-2.008 3.036v2.523h3.252c1.902-1.751 3.001-4.329 3.001-7.316z" fill="#4285F4"/>
        <path d="M10 20c2.7 0 4.964-.897 6.619-2.43l-3.228-2.505c-.894.598-2.039.951-3.391.951-2.608 0-4.814-1.761-5.6-4.133H1.037v2.61C2.684 17.79 6.082 20 10 20z" fill="#34A853"/>
        <path d="M4.4 11.883a5.996 5.996 0 010-3.766V5.507H1.037a9.989 9.989 0 000 8.986l3.363-2.61z" fill="#FBBC05"/>
        <path d="M10 3.984c1.468 0 2.786.505 3.823 1.493l2.868-2.868C14.96 1.055 12.7 0 10 0 6.082 0 2.684 2.21.963 5.507l3.362 2.61C5.111 5.746 7.317 3.984 10 3.984z" fill="#EA4335"/>
      </svg>
      Sign in with Google
    </button>
  );
};
