import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../../contexts/AuthProvider";

const Navbar = () => {
    const { user } = useContext(AuthContext);
    return (
        <div className="navbar bg-base-100">
            <div className="flex-1">
                <Link className="btn btn-ghost normal-case text-xl">
                    aSocial
                </Link>
            </div>
            <div className="flex-none">
                <ul className="menu menu-horizontal px-1">
                    <li>
                        <Link to="/">Home</Link>
                    </li>
                    <li>
                        <Link to="/media">Media</Link>
                    </li>
                    {user && (
                        <li>
                            <Link to="/message">
                                <div className="indicator">
                                    <span className="indicator-item badge badge-secondary">
                                        0
                                    </span>
                                    Message
                                </div>
                            </Link>
                        </li>
                    )}
                    <li>
                        <Link to="/about">About</Link>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default Navbar;
