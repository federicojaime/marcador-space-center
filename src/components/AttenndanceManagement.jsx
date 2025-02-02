import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Select, Pagination, TextInput } from 'flowbite-react';
import { format, subDays } from 'date-fns';
import { parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import AttendanceRecord from './AttendanceRecord';
import * as XLSX from 'xlsx';

import {
    BuildingOfficeIcon,
    DocumentArrowDownIcon,
    CalendarIcon,
    PlusIcon,
    UsersIcon,
    ClipboardIcon,
    ClockIcon,
    MagnifyingGlassIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    GlobeAltIcon,
    UserIcon,
    TagIcon
} from '@heroicons/react/24/outline';

import { Dialog, DialogContent, DialogTitle } from '@radix-ui/react-dialog';

const AttendanceManagement = ({ employees }) => {
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filterEmployee, setFilterEmployee] = useState('');
    const [filterBranch, setFilterBranch] = useState('');
    const [branches, setBranches] = useState([]);
    const [branchEmployees, setBranchEmployees] = useState(employees || []);
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

    // Estados para paginación, ordenamiento y zona horaria
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
    const [selectedTimezone, setSelectedTimezone] = useState('CR');

    // Estados para el modal de "Agregar Nota"
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [noteEmployee, setNoteEmployee] = useState(null);
    const [noteText, setNoteText] = useState("");
    const [selectedTemplate, setSelectedTemplate] = useState("");

    // --- Funciones de formateo de fecha ---
    const getFormattedDate = (dateString, dateFormat) => {
        if (!dateString) return '-';
        try {
            if (selectedTimezone === 'CR') {
                const date = new Date(dateString);
                return format(date, dateFormat);
            } else {
                const date = new Date(dateString);
                date.setHours(date.getHours() + 3);
                return format(date, dateFormat);
            }
        } catch (error) {
            console.error('Error al formatear fecha:', error);
            return '-';
        }
    };

    // Para ordenamiento: convertir a objeto Date según la zona de visualización
    const getZonedDate = (dateString) => {
        if (!dateString) return new Date(0);
        return parseISO(dateString);
    };

    const getDateRange = (rangeType, customRange) => {
        const today = new Date();
        let startDate, endDate;
        switch (rangeType) {
            case 'yesterday':
                const yesterday = subDays(today, 1);
                startDate = format(yesterday, 'yyyy-MM-dd');
                endDate = format(yesterday, 'yyyy-MM-dd');
                break;
            case 'week':
                startDate = format(subDays(today, 7), 'yyyy-MM-dd');
                endDate = format(today, 'yyyy-MM-dd');
                break;
            case 'month':
                startDate = format(subDays(today, 30), 'yyyy-MM-dd');
                endDate = format(today, 'yyyy-MM-dd');
                break;
            case 'custom':
                startDate = customRange.startDate;
                endDate = customRange.endDate;
                break;
            default:
                startDate = format(today, 'yyyy-MM-dd');
                endDate = format(today, 'yyyy-MM-dd');
        }
        return {
            startDate: startDate + ' 00:00:00',
            endDate: endDate + ' 23:59:59'
        };
    };

    const loadStats = async () => {
        try {
            const { startDate, endDate } = getDateRange(dateRange, customDateRange);
            const response = await api.getDashboardStats({
                startDate,
                endDate,
                employeeId: filterEmployee || undefined
            });
            if (response && response.data) {
                setStats(response.data);
            }
        } catch (err) {
            console.error('Error loading dashboard stats:', err);
            toast.error('Error al cargar estadísticas');
        }
    };

    const getAttendanceStatus = (checkInTime) => {
        if (!checkInTime) return null;
        const time = new Date(checkInTime);
        const totalMinutes = time.getHours() * 60 + time.getMinutes();
        if (totalMinutes <= (9 * 60 + 45)) {
            return { status: 'bono', label: 'Bono', className: 'bg-green-100 text-green-800' };
        } else if (totalMinutes <= (9 * 60 + 50)) {
            return { status: 'horario', label: 'A horario', className: 'bg-blue-100 text-blue-800' };
        } else {
            return { status: 'tardanza', label: 'Tardanza', className: 'bg-yellow-100 text-yellow-800' };
        }
    };

    const calculateExtraHours = (checkIn, checkOut) => {
        if (!checkIn || !checkOut) return "0,00";
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const startTime = new Date(checkInDate);
        startTime.setHours(9, 50, 0, 0);
        const effectiveStartTime = checkInDate > startTime ? checkInDate : startTime;
        const hoursWorked = (checkOutDate - effectiveStartTime) / (1000 * 60 * 60);
        if (hoursWorked <= 9) return "0,00";
        const extraHours = (hoursWorked - 9);
        return extraHours.toFixed(2).replace('.', ',');
    };

    const getRecordStatus = (record) => {
        if (!record.check_in) return 'Ausente';
        const checkIn = new Date(record.check_in);
        const today = new Date();
        const isYesterday = checkIn.getDate() !== today.getDate() ||
            checkIn.getMonth() !== today.getMonth() ||
            checkIn.getFullYear() !== today.getFullYear();
        if (isYesterday && !record.check_out) return 'No finalizó';
        if (!record.check_out) return 'Trabajando';
        const extraHours = calculateExtraHours(record.check_in, record.check_out);
        return extraHours !== "0,00" ? 'Horas extras' : 'Jornada finalizada';
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Ausente':
            case 'No finalizó':
                return 'bg-red-100 text-red-800';
            case 'Horas extras':
                return 'bg-purple-100 text-purple-800';
            case 'Jornada finalizada':
                return 'bg-green-100 text-green-800';
            case 'Trabajando':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const loadAttendanceData = async () => {
        setLoading(true);
        setError(null);
        try {
            const { startDate, endDate } = getDateRange(dateRange, customDateRange);
            console.log('Consultando asistencias:', { startDate, endDate, filterEmployee, filterBranch, filterStatus, searchTerm });
            const response = await api.getAttendanceRange(
                startDate.split(' ')[0],
                endDate.split(' ')[0],
                filterEmployee || undefined,
                filterBranch || undefined
            );
            if (!response || !response.data) {
                throw new Error('No se recibieron datos del servidor');
            }
            let filteredData = Array.isArray(response.data) ? response.data : [];
            const rangeStart = new Date(startDate);
            const rangeEnd = new Date(endDate);
            filteredData = filteredData.filter(record => {
                if (!record.check_in) {
                    return record.assigned_date
                        ? (new Date(record.assigned_date) >= rangeStart &&
                            new Date(record.assigned_date) <= rangeEnd)
                        : true;
                }
                const recordDate = new Date(record.check_in);
                return recordDate >= rangeStart && recordDate <= rangeEnd;
            });
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                filteredData = filteredData.filter(record =>
                    (record.employee_name?.toLowerCase() || '').includes(searchLower) ||
                    (record.nombre?.toLowerCase() || '').includes(searchLower)
                );
            }
            if (filterStatus !== 'todos') {
                filteredData = filteredData.filter(record => {
                    const checkInTime = record.check_in ? new Date(record.check_in) : null;
                    const statusObj = checkInTime ? getAttendanceStatus(checkInTime) : null;
                    switch (filterStatus) {
                        case 'presentes':
                            return record.check_in && !record.check_out;
                        case 'ausentes':
                            return !record.check_in;
                        case 'tardanzas':
                            return statusObj?.status === 'tardanza';
                        case 'bono':
                            return statusObj?.status === 'bono';
                        case 'horario':
                            return statusObj?.status === 'horario';
                        default:
                            return true;
                    }
                });
            }

            if (filterBranch) {
                filteredData = filteredData.filter(record =>
                    record.sucursal_id === parseInt(filterBranch)
                );
            }
            setAttendanceData(filteredData);
            const statsResponse = await api.getDashboardStats({
                startDate,
                endDate,
                employeeId: filterEmployee || undefined
            });
            if (statsResponse && statsResponse.data) {
                setStats(statsResponse.data);
            }
        } catch (err) {
            console.error('Error al cargar datos:', err);
            setError(err.message);
            toast.error('Error al cargar los datos: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadBranches = async () => {
            try {
                const response = await api.getBranches();
                setBranches(response.data);
            } catch (err) {
                console.error('Error al cargar sucursales:', err);
                toast.error('Error al cargar sucursales');
            }
        };
        loadBranches();
    }, []);

    const loadBranchEmployees = async (branchId) => {
        if (!branchId) {
            setBranchEmployees(employees);
            return;
        }
        try {
            const response = await api.getEmployeesByBranch(branchId);
            setBranchEmployees(response.data);
        } catch (err) {
            console.error('Error al cargar empleados de la sucursal:', err);
            toast.error('Error al cargar empleados de la sucursal');
        }
    };

    const handleBranchChange = (newBranch) => {
        setFilterBranch(newBranch);
        setFilterEmployee('');
        loadBranchEmployees(newBranch);
    };

    // Función para ordenar la tabla
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Datos ordenados según filtros y ordenamiento
    const sortedData = React.useMemo(() => {
        let sortableItems = [...attendanceData];
        if (sortConfig.key !== '') {
            sortableItems.sort((a, b) => {
                let aValue, bValue;
                switch (sortConfig.key) {
                    case 'date':
                        aValue = a.check_in ? getZonedDate(a.check_in) : (a.assigned_date ? getZonedDate(a.assigned_date) : new Date(0));
                        bValue = b.check_in ? getZonedDate(b.check_in) : (b.assigned_date ? getZonedDate(b.assigned_date) : new Date(0));
                        break;
                    case 'employee':
                        aValue = (a.employee_name || a.nombre || '').toLowerCase();
                        bValue = (b.employee_name || b.nombre || '').toLowerCase();
                        break;
                    case 'branch': {
                        const aBranch = branches.find(item => item.id === a.sucursal_id);
                        const bBranch = branches.find(item => item.id === b.sucursal_id);
                        aValue = aBranch ? aBranch.nombre.toLowerCase() : '';
                        bValue = bBranch ? bBranch.nombre.toLowerCase() : '';
                        break;
                    }
                    case 'entrada':
                        aValue = a.check_in ? getZonedDate(a.check_in) : new Date(0);
                        bValue = b.check_in ? getZonedDate(b.check_in) : new Date(0);
                        break;
                    case 'lunch_start':
                        aValue = a.lunch_start ? getZonedDate(a.lunch_start) : new Date(0);
                        bValue = b.lunch_start ? getZonedDate(b.lunch_start) : new Date(0);
                        break;
                    case 'lunch_end':
                        aValue = a.lunch_end ? getZonedDate(a.lunch_end) : new Date(0);
                        bValue = b.lunch_end ? getZonedDate(b.lunch_end) : new Date(0);
                        break;
                    case 'check_out':
                        aValue = a.check_out ? getZonedDate(a.check_out) : new Date(0);
                        bValue = b.check_out ? getZonedDate(b.check_out) : new Date(0);
                        break;
                    case 'estado':
                        aValue = getRecordStatus(a).toLowerCase();
                        bValue = getRecordStatus(b).toLowerCase();
                        break;
                    default:
                        aValue = '';
                        bValue = '';
                }
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [attendanceData, sortConfig, branches, selectedTimezone]);

    // Datos para paginación (para mostrar en la tabla)
    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Función de exportación actualizada para exportar solo los registros filtrados/ordenados (la "tabla")
    const handleExportData = async () => {
        try {
            setLoading(true);
            const { startDate, endDate } = getDateRange(dateRange, customDateRange);
            const getAttendanceStatusForExport = (checkInTime) => {
                if (!checkInTime) return null;
                const time = new Date(checkInTime);
                const totalMinutes = time.getHours() * 60 + time.getMinutes();
                if (totalMinutes <= (9 * 60 + 45)) {
                    return { status: 'Bono', label: 'Bono' };
                } else if (totalMinutes <= (9 * 60 + 50)) {
                    return { status: 'Horario', label: 'A horario' };
                } else {
                    return { status: 'Tardanza', label: 'Tardanza' };
                }
            };

            const calculateExtraHoursForExport = (checkIn, checkOut) => {
                if (!checkIn || !checkOut) return "0,00";
                const checkInDate = new Date(checkIn);
                const checkOutDate = new Date(checkOut);
                const startTime = new Date(checkInDate);
                startTime.setHours(9, 50, 0, 0);
                const effectiveStartTime = checkInDate > startTime ? checkInDate : startTime;
                const hoursWorked = (checkOutDate - effectiveStartTime) / (1000 * 60 * 60);
                if (hoursWorked <= 9) return "0,00";
                const extraHours = (hoursWorked - 9);
                return extraHours.toFixed(2).replace('.', ',');
            };

            const getRecordStatusForExport = (record) => {
                if (!record.check_in) return 'Ausente';
                const checkIn = new Date(record.check_in);
                const today = new Date();
                const isYesterday = checkIn.getDate() !== today.getDate() ||
                    checkIn.getMonth() !== today.getMonth() ||
                    checkIn.getFullYear() !== today.getFullYear();
                if (isYesterday && !record.check_out) return 'No finalizó';
                if (!record.check_out) return 'Trabajando';
                const extraHours = calculateExtraHoursForExport(record.check_in, record.check_out);
                return extraHours !== "0,00" ? 'Horas extras' : 'Jornada finalizada';
            };

            // Aquí usamos "sortedData" (todos los registros filtrados y ordenados de la tabla)
            const excelData = sortedData.map(record => {
                const extraHours = calculateExtraHoursForExport(record.check_in, record.check_out);
                const branch = branches.find(b => b.id === record.sucursal_id);
                const branchName = branch ? branch.nombre : '-';
                const checkInTime = record.check_in ? getFormattedDate(record.check_in, 'HH:mm') : '-';
                const attendanceStatus = record.check_in ? getAttendanceStatusForExport(record.check_in) : null;
                const entradaFormateo = record.check_in
                    ? `${checkInTime} ${attendanceStatus ? `(${attendanceStatus.label})` : ''}`
                    : '-';
                return {
                    'FECHA': record.check_in ? getFormattedDate(record.check_in, 'dd/MM/yyyy') : '-',
                    'EMPLEADO': record.employee_name || record.nombre || '-',
                    'SUCURSAL': branchName,
                    'ENTRADA': entradaFormateo,
                    'INICIO ALMUERZO': record.lunch_start ? getFormattedDate(record.lunch_start, 'HH:mm') : '-',
                    'FIN ALMUERZO': record.lunch_end ? getFormattedDate(record.lunch_end, 'HH:mm') : '-',
                    'SALIDA': record.check_out ? getFormattedDate(record.check_out, 'HH:mm') : '-',
                    'ESTADO': getRecordStatusForExport(record),
                    'HORAS EXTRAS': extraHours
                };
            });

            const worksheet = XLSX.utils.json_to_sheet(excelData, { cellDates: true, cellStyles: true });
            const range = XLSX.utils.decode_range(worksheet['!ref']);
            for (let R = range.s.r + 1; R <= range.e.r; ++R) {
                const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: 8 })];
                if (cell && cell.v) {
                    cell.t = 'n';
                    cell.v = Number(cell.v.toString().replace(',', '.'));
                    cell.z = '0.00';
                }
            }

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Asistencias");

            const columnWidths = [
                { wch: 12 },
                { wch: 25 },
                { wch: 25 },
                { wch: 20 },
                { wch: 15 },
                { wch: 15 },
                { wch: 10 },
                { wch: 15 },
                { wch: 12 }
            ];
            worksheet['!cols'] = columnWidths;

            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const fileName = dateRange === 'today'
                ? `asistencia-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
                : `asistencia-${format(new Date(startDate), 'yyyy-MM-dd')}-a-${format(new Date(endDate), 'yyyy-MM-dd')}.xlsx`;
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Reporte exportado exitosamente');
        } catch (err) {
            console.error('Error al exportar:', err);
            toast.error(`Error al exportar: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveRecord = async (data) => {
        try {
            // Se usa el id del registro: puede venir en "id" o en "attendance_id"
            const recordId = selectedRecord && (selectedRecord.id || selectedRecord.attendance_id);
            console.log('Estado actual:', {
                selectedRecord,
                recordId,
                dataReceived: data
            });

            if (recordId) {
                const id = parseInt(recordId, 10);
                console.log('Intentando actualizar registro:', { id, data });
                if (isNaN(id)) {
                    throw new Error('ID de registro inválido');
                }
                const updateData = {
                    ...data,
                    // Se puede enviar el id en el body si lo requiere el backend (opcional)
                    id: id
                };
                console.log('Datos a enviar para actualización:', updateData);
                await api.updateAttendance(id, updateData);
                toast.success('Registro actualizado exitosamente');
            } else {
                console.log('Creando nuevo registro:', data);
                const createData = {
                    ...data
                };
                delete createData.id; // Aseguramos que no se envíe un id vacío
                console.log('Datos a enviar para creación:', createData);
                await api.createAttendance(createData);
                toast.success('Registro creado exitosamente');
            }

            await loadAttendanceData();
            setShowRecordModal(false);
            setSelectedRecord(null);
        } catch (error) {
            console.error('Error detallado:', error);
            toast.error('Error al guardar el registro: ' + (error.message || 'Error desconocido'));
        }
    };


    useEffect(() => {
        loadAttendanceData();
    }, [dateRange, customDateRange.startDate, customDateRange.endDate, filterEmployee, filterStatus, filterBranch]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadAttendanceData();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        setCurrentPage(1);
    }, [attendanceData]);

    const StatsCards = () => (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <Card className="transform transition-all duration-200 hover:scale-105">
                <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-xs font-medium text-gray-600">Total Empleados</p>
                            <p className="text-xl font-bold text-gray-800 mt-0.5">{stats.total_employees}</p>
                        </div>
                        <div className="bg-blue-500 p-2 rounded-full">
                            <UsersIcon className="h-5 w-5 text-white" />
                        </div>
                    </div>
                </div>
            </Card>
            <Card className="transform transition-all duration-200 hover:scale-105">
                <div className="p-3 bg-gradient-to-br from-green-50 to-green-100">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-xs font-medium text-gray-600">Registros</p>
                            <p className="text-xl font-bold text-gray-800 mt-0.5">{stats.total_records}</p>
                        </div>
                        <div className="bg-green-500 p-2 rounded-full">
                            <ClipboardIcon className="h-5 w-5 text-white" />
                        </div>
                    </div>
                </div>
            </Card>
            <Card className="transform transition-all duration-200 hover:scale-105">
                <div className="p-3 bg-gradient-to-br from-yellow-50 to-yellow-100">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-xs font-medium text-gray-600">Tardanzas</p>
                            <p className="text-xl font-bold text-gray-800 mt-0.5">{stats.late_count}</p>
                        </div>
                        <div className="bg-yellow-500 p-2 rounded-full">
                            <ClockIcon className="h-5 w-5 text-white" />
                        </div>
                    </div>
                </div>
            </Card>
            <Card className="transform transition-all duration-200 hover:scale-105">
                <div className="p-3 bg-gradient-to-br from-red-50 to-red-100">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-xs font-medium text-gray-600">Horas Extra Total</p>
                            <p className="text-xl font-bold text-gray-800 mt-0.5">{stats.total_overtime_hours}h</p>
                        </div>
                        <div className="bg-red-500 p-2 rounded-full">
                            <ClockIcon className="h-5 w-5 text-white" />
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );

    return (
        <div className="p-4 max-w-7xl mx-auto">
            <header className="mb-8">
                <h3 className="text-2xl font-bold mb-2">Control de Asistencia</h3>
                <div className="flex flex-wrap gap-4">
                    <Button color="gray" onClick={handleExportData} disabled={loading}>
                        <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                        Exportar Excel
                    </Button>
                    <Button onClick={() => { setSelectedRecord(null); setShowRecordModal(true); }} disabled={loading}>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Nuevo Registro
                    </Button>
                </div>
            </header>
            <StatsCards />
            <section className="bg-white p-6 rounded-lg shadow mb-6">
                <h4 className="text-lg font-semibold mb-4">Filtros</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="space-y-1">
                        <label className="flex items-center text-xs font-medium text-gray-700">
                            <CalendarIcon className="w-3 h-3 mr-1 text-gray-500" />
                            Rango
                        </label>
                        <Select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="w-full text-sm bg-gray-50 border-gray-200 rounded focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="today">Hoy</option>
                            <option value="yesterday">Ayer</option>
                            <option value="week">Última semana</option>
                            <option value="month">Último mes</option>
                            <option value="custom">Personalizado</option>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <label className="flex items-center text-xs font-medium text-gray-700">
                            <BuildingOfficeIcon className="w-3 h-3 mr-1 text-gray-500" />
                            Sucursal
                        </label>
                        <Select
                            value={filterBranch}
                            onChange={(e) => handleBranchChange(e.target.value)}
                            className="w-full text-sm bg-gray-50 border-gray-200 rounded focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">Todas</option>
                            {branches.map(branch => (
                                <option key={branch.id} value={branch.id}>{branch.nombre}</option>
                            ))}
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <label className="flex items-center text-xs font-medium text-gray-700">
                            <UserIcon className="w-3 h-3 mr-1 text-gray-500" />
                            Empleado
                        </label>
                        <Select
                            value={filterEmployee}
                            onChange={(e) => setFilterEmployee(e.target.value)}
                            className="w-full text-sm bg-gray-50 border-gray-200 rounded focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">Todos</option>
                            {branchEmployees?.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                            ))}
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <label className="flex items-center text-xs font-medium text-gray-700">
                            <TagIcon className="w-3 h-3 mr-1 text-gray-500" />
                            Estado
                        </label>
                        <Select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full text-sm bg-gray-50 border-gray-200 rounded focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="todos">Todos</option>
                            <option value="presentes">Presentes</option>
                            <option value="ausentes">Ausentes</option>
                            <option value="bono">Bono</option>
                            <option value="horario">A horario</option>
                            <option value="tardanzas">Tardanzas</option>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <label className="flex items-center text-xs font-medium text-gray-700">
                            <GlobeAltIcon className="w-3 h-3 mr-1 text-gray-500" />
                            Zona Horaria
                        </label>
                        <Select
                            value={selectedTimezone}
                            onChange={(e) => setSelectedTimezone(e.target.value)}
                            className="w-full text-sm bg-gray-50 border-gray-200 rounded focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="CR">🇨🇷 Costa Rica</option>
                            <option value="local">🇦🇷 Argentina</option>
                        </Select>
                    </div>
                </div>
            </section>
            {dateRange === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">Desde</label>
                        <input
                            type="date"
                            value={customDateRange.startDate}
                            onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                            className="w-full rounded-md border-gray-300 shadow-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Hasta</label>
                        <input
                            type="date"
                            value={customDateRange.endDate}
                            onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                            className="w-full rounded-md border-gray-300 shadow-sm"
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
                    <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-600" />
                </div>
            ) : error ? (
                <div className="text-red-500 text-center py-4">{error}</div>
            ) : (
                <section className="bg-white p-6 rounded-lg shadow">
                    <Table hoverable>
                        <Table.Head>
                            <Table.HeadCell onClick={() => handleSort('date')} className="cursor-pointer select-none">
                                Fecha {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? <ChevronUpIcon className="w-4 h-4 inline-block" /> : <ChevronDownIcon className="w-4 h-4 inline-block" />)}
                            </Table.HeadCell>
                            <Table.HeadCell onClick={() => handleSort('employee')} className="cursor-pointer select-none">
                                Empleado {sortConfig.key === 'employee' && (sortConfig.direction === 'asc' ? <ChevronUpIcon className="w-4 h-4 inline-block" /> : <ChevronDownIcon className="w-4 h-4 inline-block" />)}
                            </Table.HeadCell>
                            <Table.HeadCell onClick={() => handleSort('branch')} className="cursor-pointer select-none">
                                Sucursal {sortConfig.key === 'branch' && (sortConfig.direction === 'asc' ? <ChevronUpIcon className="w-4 h-4 inline-block" /> : <ChevronDownIcon className="w-4 h-4 inline-block" />)}
                            </Table.HeadCell>
                            <Table.HeadCell onClick={() => handleSort('entrada')} className="cursor-pointer select-none">
                                Entrada {sortConfig.key === 'entrada' && (sortConfig.direction === 'asc' ? <ChevronUpIcon className="w-4 h-4 inline-block" /> : <ChevronDownIcon className="w-4 h-4 inline-block" />)}
                            </Table.HeadCell>
                            <Table.HeadCell onClick={() => handleSort('lunch_start')} className="cursor-pointer select-none">
                                Inicio Almuerzo {sortConfig.key === 'lunch_start' && (sortConfig.direction === 'asc' ? <ChevronUpIcon className="w-4 h-4 inline-block" /> : <ChevronDownIcon className="w-4 h-4 inline-block" />)}
                            </Table.HeadCell>
                            <Table.HeadCell onClick={() => handleSort('lunch_end')} className="cursor-pointer select-none">
                                Fin Almuerzo {sortConfig.key === 'lunch_end' && (sortConfig.direction === 'asc' ? <ChevronUpIcon className="w-4 h-4 inline-block" /> : <ChevronDownIcon className="w-4 h-4 inline-block" />)}
                            </Table.HeadCell>
                            <Table.HeadCell onClick={() => handleSort('check_out')} className="cursor-pointer select-none">
                                Salida {sortConfig.key === 'check_out' && (sortConfig.direction === 'asc' ? <ChevronUpIcon className="w-4 h-4 inline-block" /> : <ChevronDownIcon className="w-4 h-4 inline-block" />)}
                            </Table.HeadCell>
                            <Table.HeadCell onClick={() => handleSort('estado')} className="cursor-pointer select-none">
                                Estado {sortConfig.key === 'estado' && (sortConfig.direction === 'asc' ? <ChevronUpIcon className="w-4 h-4 inline-block" /> : <ChevronDownIcon className="w-4 h-4 inline-block" />)}
                            </Table.HeadCell>
                            {/* Columna Notas */}
                            <Table.HeadCell>
                                Notas
                            </Table.HeadCell>
                            <Table.HeadCell>
                                Acciones
                            </Table.HeadCell>
                        </Table.Head>
                        <Table.Body>
                            {paginatedData.length === 0 ? (
                                <Table.Row>
                                    <Table.Cell colSpan={10} className="text-center py-4">
                                        No se encontraron registros
                                    </Table.Cell>
                                </Table.Row>
                            ) : (
                                paginatedData.map((record, index) => {
                                    const branch = branches.find(b => b.id === record.sucursal_id);
                                    const branchName = branch ? branch.nombre : '-';
                                    // Obtenemos el empleado para la columna de notas
                                    const employeeData = branchEmployees.find(emp => emp.id === record.employee_id) || {};
                                    const rowClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
                                    return (
                                        <Table.Row key={record.id} className={rowClass}>
                                            <Table.Cell>{record.check_in ? getFormattedDate(record.check_in, 'dd/MM/yyyy') : '-'}</Table.Cell>
                                            <Table.Cell>{record.employee_name || record.nombre || '-'}</Table.Cell>
                                            <Table.Cell>{branchName}</Table.Cell>
                                            <Table.Cell>
                                                {record.check_in ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className={`px-2 py-1 rounded-full text-xs ${getAttendanceStatus(record.check_in)?.className || 'bg-gray-100 text-gray-800'}`}>
                                                            {getAttendanceStatus(record.check_in)?.label || 'Sin estado'}
                                                        </span>
                                                        <span className="text-xs text-gray-500">{getFormattedDate(record.check_in, 'HH:mm')}</span>
                                                    </div>
                                                ) : (
                                                    <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Ausente</span>
                                                )}
                                            </Table.Cell>
                                            <Table.Cell>{record.lunch_start ? getFormattedDate(record.lunch_start, 'HH:mm') : '-'}</Table.Cell>
                                            <Table.Cell>{record.lunch_end ? getFormattedDate(record.lunch_end, 'HH:mm') : '-'}</Table.Cell>
                                            <Table.Cell>{record.check_out ? getFormattedDate(record.check_out, 'HH:mm') : '-'}</Table.Cell>
                                            <Table.Cell>
                                                <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(getRecordStatus(record))}`}>
                                                    {getRecordStatus(record)}
                                                </span>
                                            </Table.Cell>
                                            {/* Columna Notas */}
                                            <Table.Cell onClick={() => {
                                                setNoteEmployee(employeeData);
                                                setNoteText(employeeData.notas || "");
                                                setSelectedTemplate("");
                                                setShowNoteModal(true);
                                            }} className="cursor-pointer">
                                                {employeeData.notas && employeeData.notas.trim() !== ""
                                                    ? employeeData.notas
                                                    : <span className="text-gray-400">Sin Nota</span>}
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Button size="sm" color="gray" onClick={() => { setSelectedRecord(record); setShowRecordModal(true); }}>
                                                    Editar
                                                </Button>
                                            </Table.Cell>
                                        </Table.Row>
                                    );
                                })
                            )}
                        </Table.Body>
                    </Table>
                    {totalPages > 1 && (
                        <div className="mt-4 flex justify-center">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={(page) => setCurrentPage(page)}
                                previousLabel="Anterior"
                                nextLabel="Siguiente"
                            />
                        </div>
                    )}
                </section>
            )}
            {showRecordModal && (
                <AttendanceRecord
                    isOpen={showRecordModal}
                    onClose={() => { setShowRecordModal(false); setSelectedRecord(null); }}
                    onSave={handleSaveRecord}
                    record={selectedRecord}
                    employees={branchEmployees}
                />
            )}
            {/* Modal de Agregar Nota */}
            {showNoteModal && (
                <Dialog open={showNoteModal} onOpenChange={(open) => { if (!open) { setShowNoteModal(false); setNoteEmployee(null); setNoteText(""); setSelectedTemplate(""); } }}>
                    <DialogContent className="fixed inset-0 flex items-center justify-center bg-black/50">
                        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                            <DialogTitle className="text-xl font-semibold text-gray-800 mb-4">
                                Editar Nota
                            </DialogTitle>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Empleado</label>
                                    <TextInput value={noteEmployee?.nombre || ''} disabled />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Plantilla de Nota (opcional)</label>
                                    <Select
                                        value={selectedTemplate}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setSelectedTemplate(value);
                                            if (value !== 'otro' && value !== '') {
                                                const templateText = value.charAt(0).toUpperCase() + value.slice(1);
                                                setNoteText(templateText);
                                            } else if (value === 'otro') {
                                                setNoteText("");
                                            }
                                        }}
                                    >
                                        <option value="">Seleccione una plantilla</option>
                                        <option value="vacaciones">Vacaciones</option>
                                        <option value="incapacidad">Incapacidad</option>
                                        <option value="accidente">Accidente</option>
                                        <option value="otro">Otro</option>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nota</label>
                                    <textarea
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        rows={3}
                                        value={noteText}
                                        onChange={(e) => setNoteText(e.target.value)}
                                        placeholder="Escriba aquí la nota..."
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <Button color="gray" onClick={() => { setShowNoteModal(false); setNoteEmployee(null); setNoteText(""); setSelectedTemplate(""); }}>
                                    Cancelar
                                </Button>
                                <Button color="success" onClick={async () => {
                                    try {
                                        await api.updateEmployee(noteEmployee.id, { notas: noteText });
                                        toast.success("Nota actualizada correctamente");
                                        setShowNoteModal(false);
                                        setNoteEmployee(null);
                                        setNoteText("");
                                        setSelectedTemplate("");
                                    } catch (error) {
                                        toast.error("Error al actualizar la nota: " + error.message);
                                    }
                                }}>
                                    Guardar
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default AttendanceManagement;
