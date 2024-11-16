import React, { useState, useEffect } from 'react';
import { Modal, Button, Label, TextInput, Select } from 'flowbite-react';
import { format } from 'date-fns';

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

    useEffect(() => {
        if (record) {
            setFormData({
                employee_id: record.employee_id || '',
                check_in: record.check_in ? format(new Date(record.check_in), "yyyy-MM-dd'T'HH:mm") : '',
                lunch_start: record.lunch_start ? format(new Date(record.lunch_start), "yyyy-MM-dd'T'HH:mm") : '',
                lunch_end: record.lunch_end ? format(new Date(record.lunch_end), "yyyy-MM-dd'T'HH:mm") : '',
                check_out: record.check_out ? format(new Date(record.check_out), "yyyy-MM-dd'T'HH:mm") : '',
                overtime_start: record.overtime_start ? format(new Date(record.overtime_start), "yyyy-MM-dd'T'HH:mm") : '',
                overtime_end: record.overtime_end ? format(new Date(record.overtime_end), "yyyy-MM-dd'T'HH:mm") : '',
                observations: record.observations || ''
            });
        } else {
            setFormData({
                employee_id: '',
                check_in: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
                lunch_start: '',
                lunch_end: '',
                check_out: '',
                overtime_start: '',
                overtime_end: '',
                observations: ''
            });
        }
    }, [record]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const submissionData = {
            ...formData,
            employee_id: parseInt(formData.employee_id),
        };
        onSave(submissionData);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
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
                            className="mt-1"
                        >
                            <option value="">Seleccionar empleado</option>
                            {employees?.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.nombre}
                                </option>
                            ))}
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Entrada</Label>
                            <TextInput
                                type="datetime-local"
                                name="check_in"
                                value={formData.check_in}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div>
                            <Label>Inicio Almuerzo</Label>
                            <TextInput
                                type="datetime-local"
                                name="lunch_start"
                                value={formData.lunch_start}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <Label>Fin Almuerzo</Label>
                            <TextInput
                                type="datetime-local"
                                name="lunch_end"
                                value={formData.lunch_end}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <Label>Salida</Label>
                            <TextInput
                                type="datetime-local"
                                name="check_out"
                                value={formData.check_out}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <Label>Inicio Horas Extra</Label>
                            <TextInput
                                type="datetime-local"
                                name="overtime_start"
                                value={formData.overtime_start}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <Label>Fin Horas Extra</Label>
                            <TextInput
                                type="datetime-local"
                                name="overtime_end"
                                value={formData.overtime_end}
                                onChange={handleChange}
                            />
                        </div>
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
                </form>
            </Modal.Body>
            <Modal.Footer>
                <Button type="submit" onClick={handleSubmit}>
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