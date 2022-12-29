import React from "react";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import signUpGif from "../../assets/gif/SignUp.gif";

const SignUp = () => {
    const handleSignUp = (event) => {
        event.preventDefault();
        const form = event.target;
        const { username, email, institute, address, photoURL } = form;
        const userImageHostingKey = process.env.REACT_APP_imgbb_api;

        //upload user's photo
        const formData = new FormData();
        formData.append("image", photoURL.files[0]);
        const url = `https://api.imgbb.com/1/upload?key=${userImageHostingKey}`;
        fetch(url, {
            method: "POST",
            body: formData,
        })
            .then((res) => res.json())
            .then((imageData) => {
                const userData = {
                    username: username.value,
                    email: email.value,
                    institute: institute.value,
                    address: address.value,
                    photo: imageData.data.url,
                };

                //create a user
                fetch("http://localhost:5000/users", {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                    },
                    body: JSON.stringify(userData),
                }).then((res) => {
                    if (res.status === 400) {
                        res.json().then((data) => {
                            toast.error(data.message); // "User already exists"
                        });
                    } else if (res.status === 200) {
                        res.json().then((data) => {
                            form.reset();
                            toast.success(data.message); // "User created successfully"
                        });
                    }
                });
            });
    };

    return (
        <div className="hero min-h-screen bg-base-200">
            <div className="hero-content flex-col-reverse lg:flex-row-reverse">
                <div className="text-center lg:text-left">
                    <img src={signUpGif} alt="login" />
                </div>
                <div className="card flex-shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
                    <form className="card-body" onSubmit={handleSignUp}>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Username</span>
                            </label>
                            <input
                                name="username"
                                type="text"
                                placeholder="username"
                                className="input input-bordered input-primary"
                                required
                            />
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Email</span>
                            </label>
                            <input
                                name="email"
                                type="email"
                                placeholder="email"
                                className="input input-bordered input-primary"
                                required
                            />
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Password</span>
                            </label>
                            <input
                                name="password"
                                type="password"
                                placeholder="password"
                                className="input input-bordered input-primary"
                                required
                            />
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Institute</span>
                            </label>
                            <input
                                name="institute"
                                type="text"
                                placeholder="school/college/university"
                                className="input input-bordered input-primary"
                                required
                            />
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Address</span>
                            </label>
                            <input
                                name="address"
                                type="text"
                                placeholder="address"
                                className="input input-bordered input-primary"
                                required
                            />
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Photo</span>
                            </label>
                            <input
                                name="photoURL"
                                type="file"
                                className="file-input file-input-bordered file-input-primary w-full max-w-xs"
                                required
                            />
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
                        <div className="form-control mt-6">
                            <button type="submit" className="btn btn-primary">
                                Sign Up
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
