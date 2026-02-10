import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom';
import DatePicker from "react-datepicker";
import { FaUser, FaEnvelope, FaMobileAlt, FaVenusMars, FaCalendarAlt } from "react-icons/fa";
import './AddUser.css';
import "react-datepicker/dist/react-datepicker.css";

export default function EditUser() {

    let navigate = useNavigate();

    const { id } = useParams();

    const [user, setUser] = useState({
        name: "",
        username: "",
        email: "",
        mobileNumber: "",
        gender: "",
        dob: ""
    });
    const { name, username, email, mobileNumber, gender, dob } = user;

    // State for edit form field errors (e.g., username/email exists)
    const [editErrors, setEditErrors] = useState({});

    const onInputChange = (e) => {
        // Clear specific error when user types
        if (editErrors[e.target.name]) setEditErrors(prev => ({ ...prev, [e.target.name]: '' }));
        setUser({ ...user, [e.target.name]: e.target.value });
    }

    const handleDateChange = (date) => {
        setUser({ ...user, dob: date });
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            // Format the dob to a 'dd-MM-yyyy' string
            const formattedUser = {
                ...user,
                dob: user.dob ? (() => {
                    const date = new Date(user.dob);
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`;
                })() : null
            };
            await axios.put(`/user/${id}`, formattedUser);
            navigate("/allusers");
        } catch (error) {
            if (error.response && error.response.status === 409) {
                // Safely get the error message, whether it's a string or in a JSON object
                let message = error.response.data;
                if (typeof message === 'object' && message.message) {
                    message = message.message;
                } else {
                    message = String(message);
                }
                const newErrors = {};
                if (message.toLowerCase().includes('username')) {
                    newErrors.username = message;
                } else if (message.toLowerCase().includes('email')) {
                    newErrors.email = message;
                } else if (message.toLowerCase().includes('mobile')) {
                    newErrors.mobileNumber = message;
                }
                setEditErrors(newErrors);
            } else {
                console.error("An unexpected error occurred during update:", error);
            }
        }
    }

    useEffect(() => {
        loadUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const loadUser = async () => {
        const result = await axios.get(`/user/${id}`);
        const userData = result.data;
        // The backend returns dob as "dd-MM-yyyy", which new Date() may not parse correctly.
        // We need to convert it to a valid Date object.
        if (userData.dob && typeof userData.dob === 'string') {
            const parts = userData.dob.split('-'); // [dd, MM, yyyy]
            if (parts.length === 3) {
                // new Date(year, monthIndex, day)
                userData.dob = new Date(parts[2], parts[1] - 1, parts[0]);
            }
        }
        setUser(userData);
    }

    const onReset = () => {
        setUser({
            name: "",
            username: "",
            email: "",
            mobileNumber: "",
            gender: "",
            dob: ""
        });
        setEditErrors({});
    };

    return (
        <div className='Container'>
            <div className='container d-flex align-items-center justify-content-center' style={{ minHeight: "90vh" }}>
                <div className='col-md-12 modern-form-container'>
                    <h2 className='text-center m-4'>Edit User</h2>
                    <form onSubmit={(e) => onSubmit(e)} onReset={(e) => { e.preventDefault(); onReset(); }} >
                        <div className="row">
                            <div className='col-md-6 mb-2'>
                                <div className="input-group">
                                    <span className="input-group-text"><FaUser /></span>
                                    <input type={"text"} className='form-control' placeholder='Name' name='name' value={name} onChange={(e) => onInputChange(e)} />
                                </div>
                            </div>
                            <div className='col-md-6 mb-2'>
                                <div className="input-group">
                                    <span className="input-group-text"><FaUser /></span>
                                    <input type={"text"} className='form-control' placeholder='Username' name='username' value={username} onChange={(e) => onInputChange(e)} />
                                </div>
                                {editErrors.username && <div className="text-danger mt-1" style={{ fontSize: '0.8rem' }}>{editErrors.username}</div>}
                            </div>
                        </div>
                        <div className="row">
                            <div className='col-md-6 mb-2'>
                                <div className="input-group">
                                    <span className="input-group-text"><FaEnvelope /></span>
                                    <input type={"email"} className='form-control' placeholder='Email' name='email' value={email} onChange={(e) => onInputChange(e)} />
                                </div>
                                {editErrors.email && <div className="text-danger mt-1" style={{ fontSize: '0.8rem' }}>{editErrors.email}</div>}
                            </div>
                            <div className='col-md-6 mb-2'>
                                <div className="input-group">
                                    <span className="input-group-text"><FaMobileAlt /></span>
                                    <input type={"tel"} className='form-control' placeholder='Mobile Number' name='mobileNumber' value={mobileNumber} onChange={(e) => onInputChange(e)} />
                                </div>
                                {editErrors.mobileNumber && <div className="text-danger mt-1" style={{ fontSize: '0.8rem' }}>{editErrors.mobileNumber}</div>}
                            </div>
                        </div>
                        <div className="row">
                            <div className='col-md-6 mb-2'>
                                <div className="input-group">
                                    <span className="input-group-text"><FaCalendarAlt /></span>
                                    <DatePicker
                                        className='form-control'
                                        selected={dob ? new Date(dob) : null}
                                        onChange={handleDateChange}
                                        dateFormat="dd-MMM-yyyy"
                                        placeholderText="Date of Birth"
                                        showYearDropdown
                                        scrollableYearDropdown />
                                </div>
                            </div>
                            <div className='col-md-6 mb-2'>
                                <div className="input-group">
                                    <span className="input-group-text"><FaVenusMars /></span>
                                    <select className="form-select" name="gender" value={gender} onChange={onInputChange}>
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <button type='submit' className='btn btn-submit mt-3'>Update</button>
                        <Link className='btn btn-reset mx-2 mt-3' to="/">Cancel</Link>
                    </form>
                </div>
            </div>
        </div>
    )
}