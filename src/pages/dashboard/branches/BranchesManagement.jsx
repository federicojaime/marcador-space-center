import React, { useState } from 'react';
import { Card, Button, Table, Modal, Label, TextInput } from 'flowbite-react';

const BranchesManagement = ({
    branches,
    loading,
    error,
    loadInitialData,
    handleCreateBranch,
    handleEditBranch,
}) => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        direccion: '',
        telefono: '',
        latitud: '',
        longitud: '',
    });
    const [editingBranchId, setEditingBranchId] = useState(null);

    const handleCreateBranchLocal = () => {
        handleCreateBranch(formData);
        setShowCreateModal(false);
    };

    const handleEditBranchLocal = async () => {
        try {
            await handleEditBranch(editingBranchId, formData);
            setShowEditModal(false);
            // Recargar los datos después de editar
            loadInitialData();
        } catch (error) {
            console.error('Error al editar sucursal:', error);
        }
    };

    return (
        <Card>
            <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Sucursales</h3>
                    <Button
                        color="blue"
                        onClick={() => {
                            setFormData({
                                nombre: '',
                                direccion: '',
                                telefono: '',
                                latitud: '',
                                longitud: '',
                            });
                            setShowCreateModal(true);
                        }}
                    >
                        Nueva Sucursal
                    </Button>
                </div>

                {error ? (
                    <div className="p-4 text-red-500">
                        {error}
                        <Button
                            color="blue"
                            className="mt-4"
                            onClick={loadInitialData}
                        >
                            Reintentar
                        </Button>
                    </div>
                ) : loading ? (
                    <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table hoverable>
                            <Table.Head>
                                <Table.HeadCell>Nombre</Table.HeadCell>
                                <Table.HeadCell>Dirección</Table.HeadCell>
                                <Table.HeadCell>Teléfono</Table.HeadCell>
                                <Table.HeadCell>Coordenadas</Table.HeadCell>
                                <Table.HeadCell>Acciones</Table.HeadCell>
                            </Table.Head>
                            <Table.Body className="divide-y">
                                {branches.map((branch) => (
                                    <Table.Row key={branch.id} className="bg-white">
                                        <Table.Cell className="font-medium">
                                            {branch.nombre}
                                        </Table.Cell>
                                        <Table.Cell>{branch.direccion || '-'}</Table.Cell>
                                        <Table.Cell>{branch.telefono || '-'}</Table.Cell>
                                        <Table.Cell>
                                            {branch.latitud && branch.longitud ? (
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${branch.latitud},${branch.longitud}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    Ver en mapa
                                                </a>
                                            ) : (
                                                '-'
                                            )}
                                        </Table.Cell>
                                        <Table.Cell>
                                            <div className="flex space-x-2">
                                                <Button
                                                    size="sm"
                                                    color="blue"
                                                    onClick={() => {
                                                        setEditingBranchId(branch.id);
                                                        setFormData({
                                                            nombre: branch.nombre,
                                                            direccion: branch.direccion || '',
                                                            telefono: branch.telefono || '',
                                                            latitud: branch.latitud || '',
                                                            longitud: branch.longitud || '',
                                                        });
                                                        setShowEditModal(true);
                                                    }}
                                                >
                                                    Editar
                                                </Button>
                                            </div>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table>
                    </div>
                )}

                {/* Modal para crear sucursal */}
                <Modal
                    show={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                >
                    <Modal.Header>Nueva Sucursal</Modal.Header>
                    <Modal.Body>
                        <form className="space-y-4">
                            <div>
                                <Label htmlFor="nombre" value="Nombre" />
                                <TextInput
                                    id="nombre"
                                    value={formData.nombre}
                                    onChange={(e) =>
                                        setFormData({ ...formData, nombre: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="direccion" value="Dirección" />
                                <TextInput
                                    id="direccion"
                                    value={formData.direccion}
                                    onChange={(e) =>
                                        setFormData({ ...formData, direccion: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="telefono" value="Teléfono" />
                                <TextInput
                                    id="telefono"
                                    value={formData.telefono}
                                    onChange={(e) =>
                                        setFormData({ ...formData, telefono: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="latitud" value="Latitud" />
                                <TextInput
                                    id="latitud"
                                    value={formData.latitud}
                                    onChange={(e) =>
                                        setFormData({ ...formData, latitud: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="longitud" value="Longitud" />
                                <TextInput
                                    id="longitud"
                                    value={formData.longitud}
                                    onChange={(e) =>
                                        setFormData({ ...formData, longitud: e.target.value })
                                    }
                                />
                            </div>
                        </form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            color="gray"
                            onClick={() => setShowCreateModal(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            color="success"
                            onClick={handleCreateBranchLocal}
                        >
                            Crear
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* Modal para editar sucursal */}
                <Modal
                    show={showEditModal}
                    onClose={() => setShowEditModal(false)}
                >
                    <Modal.Header>Editar Sucursal</Modal.Header>
                    <Modal.Body>
                        <form className="space-y-4">
                            <div>
                                <Label htmlFor="nombre-edit" value="Nombre" />
                                <TextInput
                                    id="nombre-edit"
                                    value={formData.nombre}
                                    onChange={(e) =>
                                        setFormData({ ...formData, nombre: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="direccion-edit" value="Dirección" />
                                <TextInput
                                    id="direccion-edit"
                                    value={formData.direccion}
                                    onChange={(e) =>
                                        setFormData({ ...formData, direccion: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="telefono-edit" value="Teléfono" />
                                <TextInput
                                    id="telefono-edit"
                                    value={formData.telefono}
                                    onChange={(e) =>
                                        setFormData({ ...formData, telefono: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="latitud-edit" value="Latitud" />
                                <TextInput
                                    id="latitud-edit"
                                    value={formData.latitud}
                                    onChange={(e) =>
                                        setFormData({ ...formData, latitud: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="longitud-edit" value="Longitud" />
                                <TextInput
                                    id="longitud-edit"
                                    value={formData.longitud}
                                    onChange={(e) =>
                                        setFormData({ ...formData, longitud: e.target.value })
                                    }
                                />
                            </div>
                        </form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            color="gray"
                            onClick={() => setShowEditModal(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            color="success"
                            onClick={handleEditBranchLocal}
                        >
                            Guardar
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </Card>
    );
};

export default BranchesManagement;