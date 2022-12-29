import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthProvider";
import UserInfo from "../UserInfo/UserInfo";
import UserModal from "./UserModal";

const About = () => {
    const { user } = useContext(AuthContext);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = (event) => {
        event.preventDefault();
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div className="flex flex-col w-full border-opacity-50">
            <div className="flex gap-3 items-center justify-center h-screen">
                {user?.email ? (
                    <div className="flex flex-col items-center">
                        <div className="avatar">
                            <div className="w-24 rounded-full">
                                <img src={user.photoURL} alt="dp" />
                            </div>
                        </div>
                        <form className="w-96">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Name</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="name"
                                    className="input input-bordered "
                                    defaultValue={user.displayName}
                                    readOnly
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Email</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="email"
                                    className="input input-bordered "
                                    defaultValue={user.email}
                                    readOnly
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">
                                        Institute
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    name="institute"
                                    placeholder="school/college/university"
                                    className="input input-bordered "
                                    // defaultValue={user.institute}
                                    readOnly
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Address</span>
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    placeholder="address"
                                    className="input input-bordered "
                                    // defaultValue={user.address}
                                    readOnly
                                />
                            </div>
                            <UserModal />
                            <div className="form-control mt-6">
                                <button
                                    className="btn btn-primary"
                                    onClick={openModal}
                                >
                                    Edit
                                </button>
                                <UserModal
                                    isOpen={isModalOpen}
                                    closeModal={closeModal}
                                />
                            </div>
                        </form>
                    </div>
                ) : (
                    <>
                        <Link to="/login">
                            <button className="btn btn-primary">Login</button>
                        </Link>
                        <Link to="/signup">
                            <button className="btn btn-primary">Sign Up</button>
                        </Link>
                    </>
                )}
            </div>
            <div className="divider">you are visiting from</div>
            <div className="text-center">
                <UserInfo />
            </div>
        </div>
    );
};

export default About;
