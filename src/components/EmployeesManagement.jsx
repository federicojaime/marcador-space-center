import React, { useState, useEffect, useMemo } from 'react';
import { Card, Table, Button, TextInput, Select } from 'flowbite-react';
import { Dialog, DialogContent, DialogTitle } from "@radix-ui/react-dialog";
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { api } from '../services/api';

const EmployeeFormDialog = ({ open, onOpenChange, employee = null, branches, onSave }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return ''; // fecha inválida
      return format(date, 'yyyy-MM-dd');
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };
  const [formData, setFormData] = useState({
    nombre: '',
    cedula: '',
    sucursal_id: '',
    fecha_ingreso: '',
    estado: 'activo',
    telefono: '',
    correo: '',
    banco: '',
    numero_cuenta: '',
    fecha_nacimiento: '',
    fecha_vencimiento_cedula: '',
    vacaciones_acumuladas: 0,
    vacaciones_usadas: 0,
    vacaciones_disponibles: 0,
    notas: ''
  });
  useEffect(() => {
    if (employee) {
      setFormData({
        ...employee,
        fecha_ingreso: formatDate(employee.fecha_ingreso),
        fecha_nacimiento: formatDate(employee.fecha_nacimiento),
        fecha_vencimiento_cedula: formatDate(employee.fecha_vencimiento_cedula),
        sucursal_id: employee.sucursal_id?.toString() || ''
      });
    } else {
      setFormData({
        nombre: '',
        cedula: '',
        sucursal_id: '',
        fecha_ingreso: format(new Date(), 'yyyy-MM-dd'),
        estado: 'activo',
        telefono: '',
        correo: '',
        banco: '',
        numero_cuenta: '',
        fecha_nacimiento: '',
        fecha_vencimiento_cedula: '',
        vacaciones_acumuladas: 0,
        vacaciones_usadas: 0,
        vacaciones_disponibles: 0,
        notas: ''
      });
    }
  }, [employee, open]);

  const validateForm = () => {
    if (!formData.nombre.trim()) {
      toast.error('El nombre es requerido');
      return false;
    }
    if (!formData.cedula.trim()) {
      toast.error('La cédula es requerida');
      return false;
    }
    if (!formData.sucursal_id) {
      toast.error('La sucursal es requerida');
      return false;
    }
    if (!formData.fecha_ingreso) {
      toast.error('La fecha de ingreso es requerida');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      toast.error(error.message || 'Error al guardar el empleado');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed inset-0 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl m-4 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <DialogTitle className="text-xl font-semibold text-gray-800">
              {employee ? 'Editar Empleado' : 'Nuevo Empleado'}
            </DialogTitle>
          </div>

          <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <TextInput
                    value={formData.nombre}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Nombre completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Cédula</label>
                  <TextInput
                    value={formData.cedula}
                    onChange={(e) => setFormData(prev => ({ ...prev, cedula: e.target.value }))}
                    placeholder="Número de cédula"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Sucursal</label>
                  <Select
                    value={formData.sucursal_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, sucursal_id: e.target.value }))}
                  >
                    <option value="">Seleccione una sucursal</option>
                    {Array.isArray(branches) && branches.map(branch => (
                      <option key={branch.id} value={branch.id}>
                        {branch.nombre}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha de Ingreso</label>
                  <TextInput
                    type="date"
                    value={formData.fecha_ingreso}
                    onChange={(e) => setFormData(prev => ({ ...prev, fecha_ingreso: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                  <TextInput
                    value={formData.telefono}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                    placeholder="Número de teléfono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Correo</label>
                  <TextInput
                    type="email"
                    value={formData.correo}
                    onChange={(e) => setFormData(prev => ({ ...prev, correo: e.target.value }))}
                    placeholder="Correo electrónico"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Banco</label>
                  <TextInput
                    value={formData.banco}
                    onChange={(e) => setFormData(prev => ({ ...prev, banco: e.target.value }))}
                    placeholder="Nombre del banco"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Número de Cuenta</label>
                  <TextInput
                    value={formData.numero_cuenta}
                    onChange={(e) => setFormData(prev => ({ ...prev, numero_cuenta: e.target.value }))}
                    placeholder="Número de cuenta bancaria"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
                  <TextInput
                    type="date"
                    value={formData.fecha_nacimiento}
                    onChange={(e) => setFormData(prev => ({ ...prev, fecha_nacimiento: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha de Vencimiento Cédula</label>
                  <TextInput
                    type="date"
                    value={formData.fecha_vencimiento_cedula}
                    onChange={(e) => setFormData(prev => ({ ...prev, fecha_vencimiento_cedula: e.target.value }))}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Notas</label>
                  <textarea
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    rows={3}
                    value={formData.notas}
                    onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                    placeholder="Notas adicionales"
                  />
                </div>
              </div>
            </form>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
            <Button color="gray" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} color="success">
              {employee ? 'Actualizar' : 'Guardar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const EmployeesManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, employee: null });

  // Estados para filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchBranches = async () => {
    try {
      const response = await api.getBranches();
      // Extraer el array de data
      setBranches(response?.data || []);
    } catch (err) {
      console.error('Error al cargar sucursales:', err);
      toast.error('Error al cargar sucursales');
      setBranches([]);
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await api.getEmployees();
      setEmployees(response.data || []);
      setError(null);
    } catch (err) {
      setError('Error al cargar empleados');
      toast.error('Error al cargar empleados');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchEmployees();
  }, []);

  const handleSaveEmployee = async (formData) => {
    try {
      if (selectedEmployee) {
        await api.updateEmployee(selectedEmployee.id, formData);
        toast.success('Empleado actualizado exitosamente');
      } else {
        await api.createEmployee(formData);
        toast.success('Empleado creado exitosamente');
      }
      await fetchEmployees();
      setDialogOpen(false);
      setSelectedEmployee(null);
    } catch (error) {
      toast.error('Error al guardar el empleado');
      throw error;
    }
  };

  const handleDelete = async (employee) => {
    try {
      await api.disableEmployee(employee.id);
      toast.success('Empleado deshabilitado exitosamente');
      await fetchEmployees();
    } catch (error) {
      toast.error('Error al deshabilitar el empleado');
    } finally {
      setConfirmDialog({ open: false, employee: null });
    }
  };

  // Filtrar empleados
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      const matchesSearch = employee.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.cedula?.includes(searchTerm);
      const matchesBranch = !branchFilter || employee.sucursal_id?.toString() === branchFilter;
      const matchesStatus = !statusFilter || employee.estado === statusFilter;

      return matchesSearch && matchesBranch && matchesStatus;
    });
  }, [employees, searchTerm, branchFilter, statusFilter]);

  // Paginar empleados
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEmployees.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEmployees, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  return (
    <Card className="w-full">
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Empleados</h3>
          <Button onClick={() => {
            setSelectedEmployee(null);
            setDialogOpen(true);
          }} color="success">
            Nuevo Empleado
          </Button>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <TextInput
            type="text"
            placeholder="Buscar por nombre o cédula..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />

          <Select
            value={branchFilter}
            onChange={(e) => {
              setBranchFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Todas las sucursales</option>
            {Array.isArray(branches) && branches.map(branch => (
              <option key={branch.id} value={branch.id}>
                {branch.nombre}
              </option>
            ))}
          </Select>

          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </Select>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">{error}</div>
        ) : (
          <>
            <Table hoverable>
              <Table.Head>
                <Table.HeadCell>Nombre</Table.HeadCell>
                <Table.HeadCell>Cédula</Table.HeadCell>
                <Table.HeadCell>Sucursal</Table.HeadCell>
                <Table.HeadCell>Estado</Table.HeadCell>
                <Table.HeadCell>Acciones</Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y">
                {paginatedEmployees.map((employee) => (
                  <Table.Row key={employee.id} className="bg-white">
                    <Table.Cell className="font-medium">
                      {employee?.nombre || 'Sin nombre'} {/* Agrega validación */}
                    </Table.Cell>
                    <Table.Cell>{employee?.cedula || 'Sin cédula'}</Table.Cell>
                    <Table.Cell>
                      {branches.find(b => b.id === employee?.sucursal_id)?.nombre || '-'}
                    </Table.Cell>
                    <Table.Cell>
                      <span className={`px-2 py-1 rounded-full text-xs ${employee?.estado === 'activo'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}>
                        {employee?.estado || 'desconocido'}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          color="success"
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setDialogOpen(true);
                          }}
                        >
                          Editar
                        </Button>
                        {employee.estado === 'activo' && (
                          <Button
                            size="sm"
                            color="failure"
                            onClick={() => setConfirmDialog({ open: true, employee })}
                          >
                            Deshabilitar
                          </Button>
                        )}
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>

            {/* Paginación */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Mostrar</span>
                <Select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-20"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </Select>
                <span className="text-sm text-gray-700">por página</span>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  Anterior
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNumber}
                      size="sm"
                      color={currentPage === pageNumber ? "info" : "gray"}
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
                <Button
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal de empleado */}
      <EmployeeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employee={selectedEmployee}
        branches={branches}
        onSave={handleSaveEmployee}
      />

      {/* Modal de confirmación para deshabilitar */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open, employee: null })}>
        <DialogContent className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <DialogTitle className="text-xl font-semibold text-gray-800 mb-4">
              Confirmar Deshabilitación
            </DialogTitle>
            <div className="mb-6">
              <p className="text-gray-600">
                ¿Estás seguro que deseas deshabilitar al empleado{' '}
                <span className="font-semibold">{confirmDialog.employee?.nombre}</span>?
                Esta acción cambiará su estado a inactivo.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                color="gray"
                onClick={() => setConfirmDialog({ open: false, employee: null })}
              >
                Cancelar
              </Button>
              <Button
                color="failure"
                onClick={() => handleDelete(confirmDialog.employee)}
              >
                Deshabilitar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default EmployeesManagement;