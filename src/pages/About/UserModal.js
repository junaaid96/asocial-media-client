import React, { useContext } from "react";
import { AuthContext } from "../../contexts/AuthProvider";

const UserModal = ({ isOpen, closeModal }) => {
    const { user } = useContext(AuthContext);

    return (
        <>
            {isOpen && (
                <div className="fixed top-0 left-0 w-full h-full m-auto bg-gray-800 bg-opacity-75 z-50">
                    <div className="container mx-auto h-full flex justify-center items-center">
                        <div className="w-96 bg-base-200 rounded-lg shadow-2xl p-6">
                            <form className="">
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
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">
                                            Email
                                        </span>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="email"
                                        className="input input-bordered "
                                        defaultValue={user.email}
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
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">
                                            Address
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        name="address"
                                        placeholder="address"
                                        className="input input-bordered "
                                        // defaultValue={user.address}
                                    />
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="btn btn-primary w-full mt-4"
                                >
                                    Save
                                </button>
                            </form>
                            <button
                                onClick={closeModal}
                                className="btn btn-outline w-full mt-4"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UserModal;
