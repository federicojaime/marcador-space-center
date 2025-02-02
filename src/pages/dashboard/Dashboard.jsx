import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { api } from '../../services/api';
import {
  ChartBarIcon,
  UsersIcon,
  ClockIcon,
  MapPinIcon,
  CalendarIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import BranchesManagement from './branches/BranchesManagement';
import EmployeesManagement from '../../components/EmployeesManagement';
import AttendanceManagement from '../../components/AttenndanceManagement';
import DashboardStats
 from '../../components/DashboardStats';
const Dashboard = () => {
  const [selectedView, setSelectedView] = useState('overview');
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    overtimeHours: 0,
    averageWorkHours: 0,
    total_hours: 0,
    present: 0,
    absent: 0,
    late: 0,
    overtime_count: 0,
    overtime_hours: 0,
    vacationRequests: 0,
    onVacation: 0,
    newHires: 0,
    turnoverRate: 0
  });

  // Mover el NavButton dentro del componente principal
  const NavButton = ({ icon: Icon, text, view }) => (
    <button
      onClick={() => setSelectedView(view)}
      className={`flex items-center w-full p-3 rounded-lg transition-colors
        ${selectedView === view 
          ? 'bg-blue-100 text-blue-700' 
          : 'hover:bg-gray-100 text-gray-600'
        }`}
    >
      <Icon className="h-6 w-6 mr-3" />
      <span className="font-medium">{text}</span>
    </button>
  );

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [employeesData, branchesData, attendanceStats] = await Promise.all([
        api.getEmployees(),
        api.getBranches(),
        api.getAttendanceStats(format(new Date(), 'yyyy-MM-dd'))
      ]);

      setEmployees(employeesData.data || []);
      setBranches(branchesData.data || []);
      const safeStats = {
        totalEmployees: employeesData.data?.length || 0,
        presentToday: attendanceStats?.present || 0,
        absentToday: (employeesData.data?.length - (attendanceStats?.present || 0)) || 0,
        lateToday: attendanceStats?.late || 0,
        overtimeHours: attendanceStats?.overtime_hours || 0,
        averageWorkHours: attendanceStats?.average_hours || 0,
        total_hours: attendanceStats?.total_hours || 0,
        present: attendanceStats?.present || 0,
        absent: attendanceStats?.absent || 0,
        late: attendanceStats?.late || 0,
        overtime_count: attendanceStats?.overtime_count || 0,
        overtime_hours: attendanceStats?.overtime_hours || 0
      };

      setStats(safeStats);
      setError(null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const Overview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Primera fila de tarjetas */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <UsersIcon className="h-8 w-8 text-blue-500 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Total Empleados</p>
              <p className="text-2xl font-bold">{stats.totalEmployees}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-green-500 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Presentes Hoy</p>
              <div>
                <span className="text-2xl font-bold">{stats.presentToday}</span>
                <span className="text-sm text-gray-500 ml-2">
                  ({stats.totalEmployees > 0
                    ? ((stats.presentToday / stats.totalEmployees) * 100).toFixed(1)
                    : '0'}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-red-500 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Ausentes Hoy</p>
              <div>
                <span className="text-2xl font-bold">{stats.absentToday}</span>
                <span className="text-sm text-gray-500 ml-2">
                  ({stats.totalEmployees > 0
                    ? ((stats.absentToday / stats.totalEmployees) * 100).toFixed(1)
                    : '0'}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tarjeta de Horas Extra */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Horas Extra</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-blue-600">
                {stats.overtime_hours?.toFixed(1)}h
              </p>
              <p className="text-sm text-gray-500">Total de horas extra</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600">
                {stats.total_hours > 0 && stats.present > 0
                  ? (stats.total_hours / stats.present).toFixed(1)
                  : '0.0'}h
              </p>
              <p className="text-sm text-gray-500">Promedio por empleado</p>
            </div>
          </div>
        </div>

        {/* Tarjeta de Llegadas Tarde */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Llegadas Tarde</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-yellow-600">
                {stats.late || 0}
              </p>
              <p className="text-sm text-gray-500">Empleados tarde hoy</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-600">
                {stats.totalEmployees > 0
                  ? ((stats.late / stats.totalEmployees) * 100).toFixed(1)
                  : '0.0'}%
              </p>
              <p className="text-sm text-gray-500">Del total</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-64 bg-white shadow-lg">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-6 px-3">Panel de Control</h2>
          <nav className="space-y-2">
            <NavButton
              icon={ChartBarIcon}
              text="Vista General"
              view="overview"
            />
            <NavButton
              icon={UsersIcon}
              text="Empleados"
              view="employees"
            />
            <NavButton
              icon={ClockIcon}
              text="Asistencia"
              view="attendance"
            />
            <NavButton
              icon={MapPinIcon}
              text="Sucursales"
              view="branches"
            />
          </nav>
        </div>
      </div>

      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          {selectedView === 'overview' && 'Vista General'}
          {selectedView === 'employees' && 'Gestión de Empleados'}
          {selectedView === 'attendance' && 'Control de Asistencia'}
          {selectedView === 'branches' && 'Gestión de Sucursales'}
        </h1>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-4">
            {error}
          </div>
        ) : (
          <>
            {selectedView === 'overview' && <DashboardStats />}
            {selectedView === 'employees' && (
              <EmployeesManagement
                employees={employees}
                branches={branches}
                onRefresh={loadInitialData}
              />
            )}
            {selectedView === 'attendance' && (
              <AttendanceManagement
                employees={employees}
                onRefresh={loadInitialData}
              />
            )}
            {selectedView === 'branches' && (
              <BranchesManagement
                branches={branches}
                onRefresh={loadInitialData}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;