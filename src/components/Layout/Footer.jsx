import codeoLogo from '../../assets/icon.png'; // Asegúrate de tener el logo de Codeo en esta ruta

const Footer = () => {
    return (
        <footer className="bg-gray-800 text-white py-2">


            {/* Divider y Créditos */}
            <div className=" border-t border-gray-600 pt-6 text-center">
                <p className="text-sm">&copy; 2024 Space Center. Todos los derechos reservados.</p>
                <div className="mt-4 flex justify-center items-center space-x-2">
                    <span className="text-sm">Realizado por</span>
                    <img src={codeoLogo} alt="Logo de Codeo" className="h-6" />
                </div>
            </div>
        </footer>
    );
};

export default Footer;
