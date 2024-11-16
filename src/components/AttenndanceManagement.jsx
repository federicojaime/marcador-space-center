import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Select } from 'flowbite-react';
import { format, subDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import AttendanceRecord from './AttendanceRecord';
import {
    ArrowPathIcon,
    DocumentArrowDownIcon,
    ChartBarIcon,
    PlusIcon,
    UsersIcon,
    ClipboardIcon,
    ClockIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const AttendanceManagement = ({ employees }) => {
    // Estados
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filterEmployee, setFilterEmployee] = useState('');
    const [filterStatus, setFilterStatus] = useState('todos');
    const [dateRange, setDateRange] = useState('today');
    const [searchTerm, setSearchTerm] = useState('');
    const [customDateRange, setCustomDateRange] = useState({
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd')
    });
    const [showRecordModal, setShowRecordModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [stats, setStats] = useState({
        total_employees: 0,
        total_records: 0,
        late_count: 0,
        total_overtime_hours: 0,
        avg_hours_worked: 0
    });

    // Función para obtener el rango de fechas según el filtro seleccionado
    const getDateRange = (rangeType, customRange) => {
        let startDate, endDate;

        switch (rangeType) {
            case 'week':
                startDate = format(subDays(new Date(), 7), 'yyyy-MM-dd');
                endDate = format(new Date(), 'yyyy-MM-dd');
                break;
            case 'month':
                startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');
                endDate = format(new Date(), 'yyyy-MM-dd');
                break;
            case 'custom':
                startDate = customRange.startDate;
                endDate = customRange.endDate;
                break;
            default: // today
                startDate = format(new Date(), 'yyyy-MM-dd');
                endDate = format(new Date(), 'yyyy-MM-dd');
        }

        return { startDate, endDate };
    };

    const loadStats = async () => {
        try {
            const { startDate, endDate } = getDateRange(dateRange, customDateRange);

            const response = await api.getDashboardStats({
                startDate,
                endDate,
                employeeId: filterEmployee || undefined
            });

            if (response.status === 'success' && response.data) {
                setStats(response.data);
            }
        } catch (err) {
            console.error('Error loading dashboard stats:', err);
            toast.error('Error al cargar estadísticas');
        }
    };

    const loadAttendanceData = async () => {
        setLoading(true);
        try {
            const { startDate, endDate } = getDateRange(dateRange, customDateRange);

            const response = await api.getAttendanceRange(
                startDate,
                endDate,
                filterEmployee || null
            );

            if (response.status === 'success' && response.data) {
                let filteredData = response.data;

                // Aplicar filtro de búsqueda
                if (searchTerm) {
                    filteredData = filteredData.filter(record =>
                        record.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        record.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                }

                // Aplicar filtro de estado
                if (filterStatus !== 'todos') {
                    filteredData = filteredData.filter(record => {
                        switch (filterStatus) {
                            case 'presentes':
                                return record.check_out !== null;
                            case 'ausentes':
                                return record.check_in === null;
                            case 'tardanzas':
                                return record.check_in && new Date(record.check_in).getHours() >= 9;
                            default:
                                return true;
                        }
                    });
                }

                setAttendanceData(filteredData);
            }

            await loadStats();
            setError(null);
        } catch (err) {
            setError('Error al cargar los datos: ' + err.message);
            toast.error('Error al cargar los datos');
        } finally {
            setLoading(false);
        }
    };

    const handleExportData = async () => {
        try {
            setLoading(true);
            const { startDate, endDate } = getDateRange(dateRange, customDateRange);

            const response = await api.exportAttendanceReport({
                startDate,
                endDate,
                employeeId: filterEmployee || null,
                searchTerm: searchTerm || null,
                status: filterStatus
            });

            if (response instanceof Blob) {
                const url = window.URL.createObjectURL(response);
                const a = document.createElement('a');
                a.href = url;
                a.download = `reporte-asistencia-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success('Reporte exportado exitosamente');
            } else {
                throw new Error('Error en el formato de respuesta');
            }
        } catch (err) {
            console.error('Error exporting:', err);
            toast.error('Error al exportar: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Efecto para cargar datos cuando cambien los filtros
    useEffect(() => {
        loadAttendanceData();
    }, [dateRange, customDateRange, filterEmployee, filterStatus]);

    // Efecto para aplicar filtro de búsqueda con debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            loadAttendanceData();
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Componente de tarjetas de estadísticas
    const StatsCards = () => (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-sm text-gray-500">Total Empleados</p>
                        <p className="text-2xl font-bold">{stats.total_employees}</p>
                    </div>
                    <UsersIcon className="h-8 w-8 text-blue-500" />
                </div>
            </Card>

            <Card>
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-sm text-gray-500">Registros</p>
                        <p className="text-2xl font-bold">{stats.total_records}</p>
                    </div>
                    <ClipboardIcon className="h-8 w-8 text-green-500" />
                </div>
            </Card>

            <Card>
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-sm text-gray-500">Tardanzas</p>
                        <p className="text-2xl font-bold">{stats.late_count}</p>
                    </div>
                    <ClockIcon className="h-8 w-8 text-yellow-500" />
                </div>
            </Card>

            <Card>
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-sm text-gray-500">Horas Extra Total</p>
                        <p className="text-2xl font-bold">{stats.total_overtime_hours}h</p>
                    </div>
                    <ClockIcon className="h-8 w-8 text-red-500" />
                </div>
            </Card>
        </div>
    );

    // Función para manejar el guardado de registros
    const handleSaveRecord = async (data) => {
        try {
            if (selectedRecord) {
                await api.updateAttendance(selectedRecord.id, data);
                toast.success('Registro actualizado exitosamente');
            } else {
                await api.createAttendance(data);
                toast.success('Registro creado exitosamente');
            }
            loadAttendanceData();
            setShowRecordModal(false);
            setSelectedRecord(null);
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al guardar el registro: ' + error.message);
        }
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Control de Asistencia</h3>
                <div className="flex gap-2">
                    <Button
                        color="gray"
                        onClick={handleExportData}
                        disabled={loading}
                    >
                        <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                        Exportar Excel
                    </Button>
                    <Button
                        onClick={() => {
                            setSelectedRecord(null);
                            setShowRecordModal(true);
                        }}
                        disabled={loading}
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Nuevo Registro
                    </Button>
                </div>
            </div>

            <StatsCards />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium mb-1">Rango</label>
                    <Select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                    >
                        <option value="today">Hoy</option>
                        <option value="week">Última semana</option>
                        <option value="month">Último mes</option>
                        <option value="custom">Personalizado</option>
                    </Select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Empleado</label>
                    <Select
                        value={filterEmployee}
                        onChange={(e) => setFilterEmployee(e.target.value)}
                    >
                        <option value="">Todos</option>
                        {employees?.map(emp => (
                            <option key={emp.id} value={emp.id}>
                                {emp.nombre}
                            </option>
                        ))}
                    </Select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Estado</label>
                    <Select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="todos">Todos</option>
                        <option value="presentes">Presentes</option>
                        <option value="ausentes">Ausentes</option>
                        <option value="tardanzas">Tardanzas</option>
                    </Select>
                </div>
            </div>

            {dateRange === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">Desde</label>
                        <input
                            type="date"
                            value={customDateRange.startDate}
                            onChange={(e) => setCustomDateRange(prev => ({
                                ...prev,
                                startDate: e.target.value
                            }))}
                            className="w-full rounded-lg border-gray-300"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Hasta</label>
                        <input
                            type="date"
                            value={customDateRange.endDate}
                            onChange={(e) => setCustomDateRange(prev => ({
                                ...prev,
                                endDate: e.target.value
                            }))}
                            className="w-full rounded-lg border-gray-300"
                        />
                    </div>
                </div>
            )}

            <div className="mb-6">
                <label className="block text-sm font-medium mb-1">Buscar empleado</label>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 pl-10"
                    />
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
            ) : error ? (
                <div className="text-red-500 text-center py-4">{error}</div>
            ) : (
                <div className="overflow-x-auto">
                    <Table hoverable>
                        <Table.Head>
                            <Table.HeadCell>Fecha</Table.HeadCell>
                            <Table.HeadCell>Empleado</Table.HeadCell>
                            <Table.HeadCell>Entrada</Table.HeadCell>
                            <Table.HeadCell>Inicio Almuerzo</Table.HeadCell>
                            <Table.HeadCell>Fin Almuerzo</Table.HeadCell>
                            <Table.HeadCell>Salida</Table.HeadCell>
                            <Table.HeadCell>Estado</Table.HeadCell>
                            <Table.HeadCell>Acciones</Table.HeadCell>
                        </Table.Head>
                        <Table.Body>
                            {attendanceData.length === 0 ? (
                                <Table.Row>
                                    <Table.Cell colSpan={8} className="text-center py-4">
                                        No se encontraron registros
                                    </Table.Cell>
                                </Table.Row>
                            ) : (
                                attendanceData.map((record) => (
                                    <Table.Row key={record.id}>
                                        <Table.Cell>
                                            {record.check_in ? format(new Date(record.check_in), 'dd/MM/yyyy') : '-'}
                                        </Table.Cell>
                                        <Table.Cell>
                                            {record.nombre || record.employee_name || '-'}
                                        </Table.Cell>
                                        <Table.Cell>
                                            {record.check_in ? format(new Date(record.check_in), 'HH:mm') : '-'}
                                        </Table.Cell>
                                        <Table.Cell>
                                            {record.lunch_start ? format(new Date(record.lunch_start), 'HH:mm') : '-'}
                                        </Table.Cell>
                                        <Table.Cell>
                                            {record.lunch_end ? format(new Date(record.lunch_end), 'HH:mm') : '-'}
                                        </Table.Cell>
                                        <Table.Cell>
                                            {record.check_out ? format(new Date(record.check_out), 'HH:mm') : '-'}
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span className={`px-2 py-1 rounded-full text-xs ${record.check_in && new Date(record.check_in).getHours() >= 9
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : record.check_out
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {record.check_in && new Date(record.check_in).getHours() >= 9
                                                    ? 'Tardanza'
                                                    : record.check_out
                                                        ? 'Completado'
                                                        : 'En progreso'}
                                            </span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Button
                                                size="sm"
                                                color="success"
                                                onClick={() => {
                                                    setSelectedRecord(record);
                                                    setShowRecordModal(true);
                                                }}
                                            >
                                                Editar
                                            </Button>
                                        </Table.Cell>
                                    </Table.Row>
                                ))
                            )}
                        </Table.Body>
                    </Table>
                </div>
            )}

            {showRecordModal && (
                <AttendanceRecord
                    isOpen={showRecordModal}
                    onClose={() => {
                        setShowRecordModal(false);
                        setSelectedRecord(null);
                    }}
                    onSave={handleSaveRecord}
                    record={selectedRecord}
                    employees={employees}
                />
            )}
        </div>
    );
};

export default AttendanceManagement;