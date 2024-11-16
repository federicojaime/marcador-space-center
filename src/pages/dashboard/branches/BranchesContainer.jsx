// pages/dashboard/BranchesPage/BranchesContainer.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import BranchesManagement from './BranchesManagement';
import api from '../../../services/api';  // Actualizada la ruta de importación

const BranchesContainer = () => {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.getBranches();
            setBranches(data);
        } catch (err) {
            setError(err.message || 'Error al cargar las sucursales');
            toast.error('Error al cargar las sucursales');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    const handleCreateBranch = async (branchData) => {
        try {
            setLoading(true);
            const newBranch = await api.createBranch(branchData);
            setBranches([...branches, newBranch]);  // Removido .data ya que api.js ya maneja la respuesta
            toast.success('Sucursal creada exitosamente');
        } catch (err) {
            toast.error(err.message || 'Error al crear la sucursal');
        } finally {
            setLoading(false);
        }
    };

    const handleEditBranch = async (id, branchData) => {
        try {
            setLoading(true);
            const updatedBranch = await api.updateBranch(id, branchData);
            setBranches(branches.map(branch =>
                branch.id === id ? updatedBranch : branch  // Removido .data ya que api.js ya maneja la respuesta
            ));
            toast.success('Sucursal actualizada exitosamente');
        } catch (err) {
            toast.error(err.message || 'Error al actualizar la sucursal');
        } finally {
            setLoading(false);
        }
    };

    return (
        <BranchesManagement
            branches={branches}
            loading={loading}
            error={error}
            loadInitialData={loadInitialData}
            handleCreateBranch={handleCreateBranch}
            handleEditBranch={handleEditBranch}
        />
    );
};

export default BranchesContainer;