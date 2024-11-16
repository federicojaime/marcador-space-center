import { Link, useLocation } from 'react-router-dom';
import { Navbar } from 'flowbite-react';
import logo from '../../assets/logo.png';

const Header = () => {
    const location = useLocation();

    const navItems = [
        { name: 'Inicio', path: '/' },
        { name: 'Registro', path: '/register' },
        { name: 'Fichaje', path: '/login' }
    ];

    return (
        <header className="sticky top-0 z-50">
            <Navbar
                fluid={true}
                rounded={true}
                className="bg-white shadow-md"
            >
                <Navbar.Brand as={Link} to="/">
                    <img
                        src={logo}
                        className="mr-3 h-14 w-auto"
                        alt="Space Center Logo"
                    />
                </Navbar.Brand>
                <Navbar.Toggle />
                <Navbar.Collapse>
                    {navItems.map((item, index) => (
                        <Navbar.Link
                            key={index}
                            as={Link}
                            to={item.path}
                            active={location.pathname === item.path}
                            className={`text-base font-medium transition-colors
                                ${location.pathname === item.path
                                    ? 'text-blue-600 hover:text-blue-700'
                                    : 'text-gray-600 hover:text-gray-900'
                                }
                            `}
                        >
                            {item.name}
                        </Navbar.Link>
                    ))}
                </Navbar.Collapse>
            </Navbar>
        </header>
    );
};

export default Header;