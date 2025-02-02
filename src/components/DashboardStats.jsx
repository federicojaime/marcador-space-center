import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { api } from '../services/api';

const DashboardStats = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    overtimeStats: {
      total: 0,
      average: 0
    },
    lateStats: {
      count: 0,
      percentage: 0
    }
  });

  const loadStats = async () => {
    try {
      // Obtener datos de empleados y estadísticas en paralelo
      const today = format(new Date(), 'yyyy-MM-dd');
      const startOfMonthDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const endOfMonthDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');

      const [employeesResponse, dashboardStats] = await Promise.all([
        api.getEmployees(),
        api.getDashboardStats({ 
          startDate: startOfMonthDate, 
          endDate: endOfMonthDate 
        })
      ]);

      const employees = employeesResponse.data || [];
      const totalEmployees = employees.length;

      // Calcular estadísticas basadas en la respuesta del dashboard
      const {
        late_count,
        total_overtime_hours,
        avg_hours_worked,
        total_records,
      } = dashboardStats.data;

      setStats({
        totalEmployees,
        presentToday: total_records || 0,
        absentToday: totalEmployees - (total_records || 0),
        lateToday: late_count || 0,
        overtimeStats: {
          total: Number(total_overtime_hours || 0).toFixed(1),
          average: Number(avg_hours_worked || 0).toFixed(1)
        },
        lateStats: {
          count: late_count || 0,
          percentage: totalEmployees > 0 ? 
            Number(((late_count || 0) / totalEmployees) * 100).toFixed(1) : 0
        }
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  useEffect(() => {
    loadStats();
    // Actualizar cada 5 minutos
    const interval = setInterval(loadStats, 300000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Empleados */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Empleados</p>
              <p className="text-2xl font-bold">{stats.totalEmployees}</p>
            </div>
          </div>
        </div>

        {/* Presentes Hoy */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
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

        {/* Ausentes Hoy */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
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

         <div className="grid ">
     
        {/* Horas Extra <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Horas Extra</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-blue-600">
                {stats.overtimeStats.total}h
              </p>
              <p className="text-sm text-gray-500">Total de horas extra</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600">
                {stats.overtimeStats.average}h
              </p>
              <p className="text-sm text-gray-500">Promedio por empleado</p>
            </div>
          </div>
        </div>*/}

        {/* Llegadas Tarde */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Llegadas Tarde</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-yellow-600">
                {stats.lateStats.count}
              </p>
              <p className="text-sm text-gray-500">Empleados tarde hoy</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-600">
                {stats.lateStats.percentage}%
              </p>
              <p className="text-sm text-gray-500">Del total</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;