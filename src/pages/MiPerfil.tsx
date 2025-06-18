
import React from 'react';
import { UsuarioLogueadoDetalle } from '@/components/users/UsuarioLogueadoDetalle';
import { useNavigate } from 'react-router-dom';

const MiPerfil = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(-1); // Volver a la página anterior
  };

  return <UsuarioLogueadoDetalle onClose={handleClose} />;
};

export default MiPerfil;
