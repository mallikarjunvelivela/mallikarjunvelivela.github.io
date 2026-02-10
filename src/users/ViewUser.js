import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom';

export default function ViewUser() {

    const [user, setUser] = useState({
        name: "",
        username: "",
        email: "",
        mobileNumber: "",
        gender: "",
        dob: ""
    });
    const { id } = useParams();

    useEffect(() => {
        loadUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const loadUser = async () => {
        try {
            const result = await axios.get(`/user/${id}`);
            setUser(result.data);
        } catch (error) {
            console.error("Error loading user:", error);
        }
    }

    return (
        <div className='Container'>
            <div className='row'>
                <div className='col-md-6 offset-md-3 border rounded p-4 mt-2 shadow'>
                    <div className='card'>
                        <div className='card-header'>
                            {user.name} Details
                        </div>
                        <div className='card-body'>
                            <p className='card-text'>Name : {user.name}</p>
                            <p className='card-text'>Username : {user.username}</p>
                            <p className='card-text'>Email : {user.email}</p>
                            <p className='card-text'>Mobile Number : {user.mobileNumber}</p>
                            <p className='card-text'>Gender : {user.gender}</p>
                            <p className='card-text'>Date of Birth : {user.dob}</p>
                        </div>
                    </div>
                    <Link className='btn btn-primary my-2' to={'/'}>Back to Home</Link>
                </div>
            </div>
        </div>
    )
}
