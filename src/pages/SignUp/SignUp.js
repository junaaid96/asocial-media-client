import React, { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import signUpGif from "../../assets/gif/SignUp.gif";
import { AuthContext } from "../../contexts/AuthProvider";
import CreatingAccount from "../LoadingScreen/CreatingAccount";

const SignUp = () => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm();
    const [loading, setLoading] = useState(false);
    const { createUser, updateUser } = useContext(AuthContext);
    const [error, setError] = useState("");
    const userImageHostingKey = process.env.REACT_APP_imgbb_api;
    const navigate = useNavigate();

    const handleSignUp = (data) => {
        if (!error) {
            setLoading(true);
        }

        //upload user's photo
        const formData = new FormData();
        formData.append("image", data.photo[0]);
        const url = `https://api.imgbb.com/1/upload?key=${userImageHostingKey}`;
        fetch(url, {
            method: "POST",
            body: formData,
        })
            .then((res) => res.json())
            .then((imageData) => {
                //create a user with email and password
                createUser(data.email, data.password)
                    .then((userCredential) => {
                        const user = userCredential.user;
                        console.log(user);
                        const userInformation = {
                            displayName: data.username,
                        };
                        //update user's display name
                        updateUser(userInformation);
                        //save user's data to database
                        saveUserData(
                            data.username,
                            data.email,
                            data.institute,
                            data.address,
                            imageData.data.display_url
                        );
                        navigate("/about");
                    })
                    .catch((err) => {
                        console.log(err);
                        setError(err.message);
                        setLoading(false);
                    });
            });

        const saveUserData = (username, email, institute, address, photo) => {
            const userData = {
                username,
                email,
                institute,
                address,
                photo,
            };
            //create a user
            fetch("https://asocial-media-server.onrender.com/users", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify(userData),
            }).then((res) => {
                if (res.status === 400) {
                    res.json().then((data) => {
                        setLoading(false);
                        toast.error(data.message); // "User already exists"
                    });
                } else if (res.status === 200) {
                    res.json().then((data) => {
                        reset();
                        setLoading(false);
                        toast.success(data.message);
                        // "User created successfully"
                    });
                }
            });
        };
    };

    return (
        <>
            {loading && <CreatingAccount />}
            <div className="hero min-h-screen bg-base-200">
                <div className="hero-content flex-col-reverse lg:flex-row-reverse">
                    <div className="text-center lg:text-left">
                        <img src={signUpGif} alt="login" />
                    </div>
                    <div className="card flex-shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
                        <form
                            className="card-body"
                            onSubmit={handleSubmit(handleSignUp)}
                        >
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Username</span>
                                </label>
                                <input
                                    {...register("username", {
                                        required: "Username is Required",
                                    })}
                                    type="text"
                                    placeholder="username"
                                    className="input input-bordered input-primary"
                                />
                                {errors.username && (
                                    <p className="text-red-500">
                                        {errors.username.message}
                                    </p>
                                )}
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Email</span>
                                </label>
                                <input
                                    {...register("email", {
                                        required: "Email is Required",
                                    })}
                                    type="email"
                                    placeholder="email"
                                    className="input input-bordered input-primary"
                                />
                                {errors.email && (
                                    <p className="text-red-500">
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Password</span>
                                </label>
                                <input
                                    {...register("password", {
                                        required: "Password is Required",
                                    })}
                                    type="password"
                                    placeholder="password"
                                    className="input input-bordered input-primary"
                                />
                                {errors.password && (
                                    <p className="text-red-500">
                                        {errors.password.message}
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
                                    className="input input-bordered input-primary"
                                />
                                {errors.institute && (
                                    <p className="text-red-500">
                                        {errors.institute.message}
                                    </p>
                                )}
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Address</span>
                                </label>
                                <input
                                    {...register("address", {
                                        required: "Address is Required",
                                    })}
                                    type="text"
                                    placeholder="address"
                                    className="input input-bordered input-primary"
                                />
                                {errors.address && (
                                    <p className="text-red-500">
                                        {errors.address.message}
                                    </p>
                                )}
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Photo</span>
                                </label>
                                <input
                                    {...register("photo", {
                                        required: "Photo is Required",
                                    })}
                                    type="file"
                                    placeholder="photo"
                                    className="file-input file-input-bordered file-input-primary w-full max-w-xs"
                                />
                                {errors.photo && (
                                    <p className="text-red-500">
                                        {errors.photo.message}
                                    </p>
                                )}
                            </div>
                            <label className="mt-3">
                                Already have an account? Please{" "}
                                <Link
                                    to="/login"
                                    className="font-bold text-primary"
                                >
                                    Login
                                </Link>
                            </label>
                            {error && (
                                <p className="text-white bg-red-600 rounded-lg p-2">
                                    {error}
                                </p>
                            )}
                            <div className="form-control mt-6">
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                    Sign Up
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SignUp;
