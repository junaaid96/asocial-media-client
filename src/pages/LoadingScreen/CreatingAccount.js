import React from 'react';
import ReactLoading from "react-loading";

const CreatingAccount = () => {
    return (
        <div className="flex flex-col items-center my-20">
            <ReactLoading type="cubes" />
            <p>Creating ccount</p>
        </div>
    );
};

export default CreatingAccount;