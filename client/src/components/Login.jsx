import React from 'react';

const Login = () => {
  const googleLogin = () => {
    window.open("http://localhost:5000/auth/google", "_self");
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h2>Login to GitHub Repo Auditor</h2>
      <button onClick={googleLogin}>Login with Google</button>
    </div>
  );
};

export default Login;
