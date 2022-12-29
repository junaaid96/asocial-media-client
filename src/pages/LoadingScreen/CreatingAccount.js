import React from 'react';
import ReactLoading from "react-loading";

const CreatingAccount = () => {
    return (
        <div className="flex flex-col items-center mt-20">
            <ReactLoading type="cubes" />
            <p>Creating Account</p>
        </div>
    );
};

export default CreatingAccount;