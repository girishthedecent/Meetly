import React from 'react';
import { Navigate } from 'react-router-dom';

const withAuth = (WrappedComponent) => {
  const AuthComponent = (props) => {
    const token = localStorage.getItem('token');

    if (!token) {
      // If there's no token, redirect to the authentication page
      return <Navigate to="/auth" />;
    }

    // If the token exists, render the wrapped component
    return <WrappedComponent {...props} />;
  };

  return AuthComponent;
};

export default withAuth;