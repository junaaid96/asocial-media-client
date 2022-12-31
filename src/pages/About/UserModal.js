import React, { useContext } from "react";
import { useForm } from "react-hook-form";
import { UserDataContext } from "../../contexts/UserData";
import LoadingScreen from "../LoadingScreen/LoadingScreen";

const UserModal = ({ isOpen, closeModal, handleUpdate }) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    const { userInformation } = useContext(UserDataContext);
    const { userData, isLoading } = userInformation;

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <>
            {isOpen && (
                <div className="fixed top-0 left-0 right-0 bottom-0 bg-base-300 h-fit p-12 w-1/2 z-999 m-auto">
                    <div className=" mx-auto h-full flex justify-center items-center">
                        <div className="w-96 h-1/2 bg-base-100 rounded-lg shadow-2xl p-6">
                            <h3 className="text-2xl font-bold text-center mb-6">
                                Update User Information
                            </h3>
                            <div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">
                                            Username
                                        </span>
                                    </label>
                                    <input
                                        {...register("username", {
                                            required: "Username is Required",
                                        })}
                                        type="text"
                                        placeholder="username"
                                        defaultValue={userData.username}
                                        className="input input-bordered"
                                    />
                                    {errors.username && (
                                        <p className="text-red-500">
                                            {errors.username.message}
                                        </p>
                                    )}
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">
                                            Email
                                        </span>
                                    </label>
                                    <input
                                        {...register("email", {
                                            required: "Email is Required",
                                        })}
                                        type="email"
                                        placeholder="email"
                                        defaultValue={userData.email}
                                        className="input input-bordered "
                                        readOnly
                                    />
                                    {errors.email && (
                                        <p className="text-red-500">
                                            {errors.email.message}
                                        </p>
                                    )}
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">
                                            Institute
                                        </span>
                                    </label>
                                    <input
                                        {...register("institute", {
                                            required: "Institute is Required",
                                        })}
                                        type="text"
                                        placeholder="school/college/university"
                                        defaultValue={userData.institute}
                                        className="input input-bordered"
                                    />
                                    {errors.institute && (
                                        <p className="text-red-500">
                                            {errors.institute.message}
                                        </p>
                                    )}
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">
                                            Address
                                        </span>
                                    </label>
                                    <input
                                        {...register("address", {
                                            required: "Address is Required",
                                        })}
                                        type="text"
                                        placeholder="address"
                                        defaultValue={userData.address}
                                        className="input input-bordered"
                                    />
                                    {errors.address && (
                                        <p className="text-red-500">
                                            {errors.address.message}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={handleSubmit(handleUpdate)}
                                    className="btn btn-primary w-full mt-4"
                                >
                                    Save
                                </button>
                            </div>
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
