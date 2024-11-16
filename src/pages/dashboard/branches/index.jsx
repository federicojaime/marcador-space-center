// pages/dashboard/BranchesPage/index.jsx
import React from 'react';
import BranchesContainer from './BranchesContainer';

const BranchesPage = () => {
    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold mb-6">Gestión de Sucursales</h1>
            <BranchesContainer />
        </div>
    );
};

export default BranchesPage;