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
};

export const api = {
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

    getEmployeesByBranch: async (branchId) => {
        const response = await fetch(`${env.API_URL}/employees/by-branch/${branchId}`, {
            headers
        });
        return handleResponse(response);
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

    updateEmployeePin: async (employeeId, pin) => {
        const response = await fetch(`${env.API_URL}/employees/${employeeId}/pin`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ pin })
        });
        return handleResponse(response);
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
        console.log('Consultando asistencia para fecha:', date);
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
        console.log('Consultando estadísticas:', { startDate, endDate, employeeId });
        const params = new URLSearchParams({
            startDate,
            endDate,
            ...(employeeId && { employeeId })
        });
        const response = await fetch(`${env.API_URL}/attendance/dashboard-stats?${params}`);
        if (!response.ok) throw new Error('Error al obtener estadísticas del dashboard');
        return response.json();
    },

    getAttendanceRange: async (startDate, endDate, employeeId, branchId) => {
        const params = new URLSearchParams({
            startDate,
            endDate,
            ...(employeeId && { employeeId }),
            ...(branchId && { branchId }),
        });
        const response = await fetch(`${env.API_URL}/attendance/range?${params}`, {
            headers,
        });
        return handleResponse(response);
    },

    createAttendance: async (data) => {
        try {
            // Obtener el token del localStorage o de donde lo tengas almacenado
            const token = localStorage.getItem('token'); // o como lo tengas guardado

            const response = await fetch(`${env.API_URL}/attendance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Agregar el header de autorización
                },
                body: JSON.stringify(data)
            });

            const responseText = await response.text();
            console.log('Respuesta del servidor:', responseText);

            let parsedData;
            try {
                parsedData = JSON.parse(responseText);
            } catch (e) {
                if (response.status === 401) {
                    throw new Error('No autorizado. Por favor, inicie sesión nuevamente.');
                }
                console.error('Error parseando respuesta:', e);
            }

            if (!response.ok) {
                throw new Error(parsedData?.message || 'Error al crear registro');
            }

            return parsedData;
        } catch (error) {
            console.error('Error completo en createAttendance:', error);
            throw new Error(error.message || 'Error al crear registro');
        }
    },

    updateAttendance: async (id, data) => {
        try {
            const response = await fetch(`${env.API_URL}/attendance/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const responseText = await response.text();
            console.log('Respuesta del servidor:', responseText);

            if (!response.ok) {
                try {
                    const errorData = JSON.parse(responseText);
                    throw new Error(errorData.message || 'Error al actualizar registro');
                } catch (e) {
                    throw new Error(`Error al actualizar registro: ${responseText}`);
                }
            }

            return JSON.parse(responseText);
        } catch (error) {
            console.error('Error completo en updateAttendance:', error);
            throw error;
        }
    },

    changeEmployeeState: async (employeeId, payload) => {
        const response = await fetch(`${env.API_URL}/employees/${employeeId}/state`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        return handleResponse(response);
    },

    exportAttendanceReport: async ({ startDate, endDate, employeeId, searchTerm, status, includeBranch }) => {
        console.log('Exportando reporte:', { startDate, endDate, employeeId, searchTerm, status, includeBranch });
        const params = new URLSearchParams({
            startDate: startDate.split(' ')[0],
            endDate: endDate.split(' ')[0],
            ...(employeeId && { employeeId }),
            ...(searchTerm && { searchTerm }),
            ...(status && status !== 'todos' && { status }),
            includeBranch: includeBranch ? 'true' : 'false'
        });
        const response = await fetch(`${env.API_URL}/attendance/export?${params}`, {
            headers: {
                ...headers,
                'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            },
            method: 'GET'
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error('Error al exportar reporte');
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('spreadsheetml.sheet')) {
            throw new Error('Formato de respuesta incorrecto');
        }
        return response.blob();
    }
};

export default api;
