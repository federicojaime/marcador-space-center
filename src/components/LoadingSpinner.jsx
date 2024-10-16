// src/components/LoadingSpinner.jsx

import React from 'react';

const LoadingSpinner = ({ message }) => {
    return (
        <div className="flex flex-col items-center justify-center">
            <div className="loader mb-4"></div>
            <p className="text-gray-700">{message}</p>
        </div>
    );
};

export default LoadingSpinner;
