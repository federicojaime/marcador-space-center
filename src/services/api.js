import env from '../config/env';

const handleResponse = async (response) => {
    if (!response.ok) {
        try {
            const error = await response.json();
            throw new Error(error.message || `Error ${response.status}: ${response.statusText}`);
        } catch (e) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
    }

    try {
        const data = await response.json();
        return data;
    } catch (e) {
        throw new Error('Error al procesar la respuesta del servidor');
    }
};

const headers = {
    'Content-Type': 'application/json',
    // Puedes agregar aquí headers adicionales como autorización
};

export const api = {
    // Endpoints de Sucursales (Branches)
    getBranches: async () => {
        const response = await fetch(`${env.API_URL}/branches`, {
            headers
        });
        return handleResponse(response);
    },

    getBranchById: async (id) => {
        const response = await fetch(`${env.API_URL}/branches/${id}`, {
            headers
        });
        return handleResponse(response);
    },

    createBranch: async (branchData) => {
        const response = await fetch(`${env.API_URL}/branches`, {
            method: 'POST',
            headers,
            body: JSON.stringify(branchData),
        });
        return handleResponse(response);
    },

    updateBranch: async (id, branchData) => {
        const response = await fetch(`${env.API_URL}/branches/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(branchData),
        });
        return handleResponse(response);
    },

    deleteBranch: async (id) => {
        const response = await fetch(`${env.API_URL}/branches/${id}`, {
            method: 'DELETE',
            headers,
        });
        return handleResponse(response);
    },

    getEmployees: async () => {
        const response = await fetch(`${env.API_URL}/employees/details`);
        if (!response.ok) throw new Error('Error al obtener empleados');
        return response.json();
    },

    createEmployee: async (employeeData) => {
        const response = await fetch(`${env.API_URL}/employees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employeeData)
        });
        if (!response.ok) throw new Error('Error al crear empleado');
        return response.json();
    },

    updateEmployee: async (id, employeeData) => {
        const response = await fetch(`${env.API_URL}/employees/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employeeData)
        });
        if (!response.ok) throw new Error('Error al actualizar empleado');
        return response.json();
    },

    disableEmployee: async (id) => {
        const response = await fetch(`${env.API_URL}/employees/${id}/disable`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Error al deshabilitar empleado');
        return response.json();
    },



    getAttendanceByEmployee: async (employeeId, date) => {
        const url = new URL(`${env.API_URL}/attendance/employee/${employeeId}`);
        if (date) {
            url.searchParams.append('date', date);
        }
        const response = await fetch(url, { headers });
        return handleResponse(response);
    },




    bulkCreateAttendance: async (attendanceRecords) => {
        const response = await fetch(`${env.API_URL}/attendance/bulk`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ records: attendanceRecords }),
        });
        return handleResponse(response);
    },




    get: async (endpoint) => {
        const response = await fetch(`${env.API_URL}${endpoint}`, {
            headers
        });
        return handleResponse(response);
    },

    post: async (endpoint, data) => {
        const response = await fetch(`${env.API_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },

    put: async (endpoint, data) => {
        const response = await fetch(`${env.API_URL}${endpoint}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },

    // Función auxiliar para hacer peticiones personalizadas
    makeRequest: async (endpoint, options = {}) => {
        const url = `${env.API_URL}${endpoint}`;
        const defaultOptions = {
            headers,
            ...options,
        };

        if (options.body && typeof options.body === 'object') {
            defaultOptions.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, defaultOptions);
            return handleResponse(response);
        } catch (error) {
            console.error('Error en la petición:', error);
            throw new Error('Error en la conexión con el servidor');
        }
    },


    getAttendance: async (date) => {
        const response = await fetch(`${env.API_URL}/attendance?date=${date}`);
        if (!response.ok) throw new Error('Error al obtener asistencias');
        return response.json();
    },





    getAttendanceStats: async () => {
        const response = await fetch(`${env.API_URL}/attendance/stats`);
        if (!response.ok) throw new Error('Error al obtener estadísticas');
        return response.json();
    },



    getDashboardStats: async ({ startDate, endDate, employeeId }) => {
        const params = new URLSearchParams({
            startDate,
            endDate,
            ...(employeeId && { employeeId })
        });

        const response = await fetch(`${env.API_URL}/attendance/dashboard-stats?${params}`);
        if (!response.ok) throw new Error('Error al obtener estadísticas del dashboard');
        return response.json();
    },

    getAttendanceRange: async (startDate, endDate, employeeId) => {
        const params = new URLSearchParams({
            startDate,
            endDate,
            ...(employeeId && { employeeId })
        });

        const response = await fetch(`${env.API_URL}/attendance/range?${params}`);
        if (!response.ok) throw new Error('Error al obtener registros de asistencia');
        return response.json();
    },

    createAttendance: async (data) => {
        const response = await fetch(`${env.API_URL}/attendance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Error al crear registro');
        return response.json();
    },

    updateAttendance: async (id, data) => {
        const response = await fetch(`${env.API_URL}/attendance/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Error al actualizar registro');
        return response.json();
    },

    exportAttendanceReport: async ({ startDate, endDate, employeeId, searchTerm, status }) => {
        const params = new URLSearchParams({
            startDate,
            endDate,
            ...(employeeId && { employeeId }),
            ...(searchTerm && { searchTerm }),
            ...(status !== 'all' && { status })
        });

        const response = await fetch(`${env.API_URL}/attendance/export?${params}`);
        if (!response.ok) throw new Error('Error al exportar reporte');
        return response.blob();
    }
};

export default api;