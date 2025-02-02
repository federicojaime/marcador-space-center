import React, { useState, useEffect } from 'react';
import { Modal, Button, Label, TextInput, Select } from 'flowbite-react';
import { format, parseISO } from 'date-fns';

const AttendanceRecord = ({ isOpen, onClose, onSave, record, employees }) => {
    const [formData, setFormData] = useState({
        employee_id: '',
        check_in: '',
        lunch_start: '',
        lunch_end: '',
        check_out: '',
        overtime_start: '',
        overtime_end: '',
        observations: ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (record) {
            setFormData({
                employee_id: record.employee_id || '',
                check_in: record.check_in ? formatDateForInput(record.check_in) : '',
                lunch_start: record.lunch_start ? formatDateForInput(record.lunch_start) : '',
                lunch_end: record.lunch_end ? formatDateForInput(record.lunch_end) : '',
                check_out: record.check_out ? formatDateForInput(record.check_out) : '',
                overtime_start: record.overtime_start ? formatDateForInput(record.overtime_start) : '',
                overtime_end: record.overtime_end ? formatDateForInput(record.overtime_end) : '',
                observations: record.observations || ''
            });
        } else {
            const now = new Date();
            setFormData({
                employee_id: '',
                check_in: format(now, "yyyy-MM-dd'T'HH:mm"),
                lunch_start: '',
                lunch_end: '',
                check_out: '',
                overtime_start: '',
                overtime_end: '',
                observations: ''
            });
        }
    }, [record]);

    const formatDateForInput = (dateString) => {
        try {
            if (!dateString) return '';
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            return format(date, "yyyy-MM-dd'T'HH:mm");
        } catch (error) {
            console.error('Error formateando fecha:', error);
            return '';
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.employee_id) {
            newErrors.employee_id = 'Seleccione un empleado';
        }

        if (!formData.check_in) {
            newErrors.check_in = 'La hora de entrada es requerida';
        }

        const validateDateOrder = (startDate, endDate, fieldName, message) => {
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end <= start) {
                    newErrors[fieldName] = message;
                }
            }
        };

        validateDateOrder(
            formData.lunch_start,
            formData.lunch_end,
            'lunch_end',
            'La hora de fin de almuerzo debe ser posterior a la hora de inicio'
        );

        validateDateOrder(
            formData.check_in,
            formData.check_out,
            'check_out',
            'La hora de salida debe ser posterior a la hora de entrada'
        );

        validateDateOrder(
            formData.overtime_start,
            formData.overtime_end,
            'overtime_end',
            'La hora de fin de horas extra debe ser posterior a la hora de inicio'
        );

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const formatDateForSubmission = (dateString) => {
        try {
            if (!dateString) return null;
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return null;
            return dateString.replace('T', ' ') + ':00';
        } catch (error) {
            console.error('Error formateando fecha para envío:', error);
            return null;
        }
    };

    // En la función handleSubmit del componente AttendanceRecord
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            const submissionData = {
                employee_id: parseInt(formData.employee_id) || null,
                check_in: formatDateForSubmission(formData.check_in),
                lunch_start: formatDateForSubmission(formData.lunch_start),
                lunch_end: formatDateForSubmission(formData.lunch_end),
                check_out: formatDateForSubmission(formData.check_out),
                overtime_start: formatDateForSubmission(formData.overtime_start),
                overtime_end: formatDateForSubmission(formData.overtime_end),
                observations: formData.observations || null
            };

            // Validación adicional antes de enviar
            if (!submissionData.employee_id || !submissionData.check_in) {
                setErrors(prev => ({
                    ...prev,
                    submit: 'Empleado y hora de entrada son requeridos'
                }));
                return;
            }

            console.log('Datos a enviar:', submissionData);

            // Verificar si estamos creando o actualizando
            if (record && record.id) {
                // Actualización
                submissionData.id = record.id; // Asegurarse de que el ID está incluido
            }

            await onSave(submissionData);
        } catch (error) {
            console.error('Error preparando datos:', error);
            setErrors(prev => ({
                ...prev,
                submit: `Error: ${error.message || 'Error al procesar el formulario'}`
            }));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    return (
        <Modal show={isOpen} onClose={onClose} size="xl">
            <Modal.Header>
                {record ? 'Editar Registro de Asistencia' : 'Nuevo Registro de Asistencia'}
            </Modal.Header>
            <Modal.Body>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label>Empleado</Label>
                        <Select
                            name="employee_id"
                            value={formData.employee_id}
                            onChange={handleChange}
                            required
                            className={`mt-1 ${errors.employee_id ? 'border-red-500' : ''}`}
                        >
                            <option value="">Seleccionar empleado</option>
                            {employees?.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.nombre}
                                </option>
                            ))}
                        </Select>
                        {errors.employee_id && (
                            <p className="text-red-500 text-sm mt-1">{errors.employee_id}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { label: 'Entrada', name: 'check_in', required: true },
                            { label: 'Inicio Almuerzo', name: 'lunch_start' },
                            { label: 'Fin Almuerzo', name: 'lunch_end' },
                            { label: 'Salida', name: 'check_out' },
                            { label: 'Inicio Horas Extra', name: 'overtime_start' },
                            { label: 'Fin Horas Extra', name: 'overtime_end' }
                        ].map((field) => (
                            <div key={field.name}>
                                <Label>{field.label}</Label>
                                <TextInput
                                    type="datetime-local"
                                    name={field.name}
                                    value={formData[field.name]}
                                    onChange={handleChange}
                                    required={field.required}
                                    className={errors[field.name] ? 'border-red-500' : ''}
                                />
                                {errors[field.name] && (
                                    <p className="text-red-500 text-sm mt-1">{errors[field.name]}</p>
                                )}
                            </div>
                        ))}
                    </div>

                    <div>
                        <Label>Observaciones</Label>
                        <textarea
                            name="observations"
                            value={formData.observations}
                            onChange={handleChange}
                            className="w-full rounded-lg border-gray-300"
                            rows={3}
                        />
                    </div>

                    {errors.submit && (
                        <p className="text-red-500 text-center">{errors.submit}</p>
                    )}
                </form>
            </Modal.Body>
            <Modal.Footer>
                <Button type="submit" onClick={handleSubmit} color="success">
                    {record ? 'Actualizar' : 'Guardar'}
                </Button>
                <Button color="gray" onClick={onClose}>
                    Cancelar
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AttendanceRecord;