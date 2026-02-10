import axios from 'axios';
import React, { useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaMobileAlt, FaLock, FaVenusMars, FaCalendarAlt } from "react-icons/fa";
import './AddUser.css';
import { AuthContext } from '../context/AuthContext';

export default function AddUser() {

    let navigate = useNavigate();
    const { login } = useContext(AuthContext);

    // State to manage which view is active: 'login', 'signup', or 'forgotPassword'
    const [viewMode, setViewMode] = useState('login');
    // State to manage steps within the forgot password flow
    const [forgotPasswordStep, setForgotPasswordStep] = useState('enteremailOrMobile'); // 'enteremailOrMobile', 'enterOtp', 'resetPassword'

    const [forgotPasswordData, setForgotPasswordData] = useState({
        emailOrMobile: '', otp: '', newPassword: '', confirmNewPassword: ''
    });

    const [user, setUser] = useState({
        name: "",
        username: "",
        email: "",
        mobileNumber: "",
        password: "",
        confirmPassword: "",
        gender: "",
        dob: ""
    });
    const { name, username, email, mobileNumber, password, confirmPassword, gender, dob } = user;

    // State for Login form
    const [loginCreds, setLoginCreds] = useState({
        emailOrMobile: '', // for username or email
        password: ''
    });

    // State for login error
    const [loginError, setLoginError] = useState('');

    // State for password confirmation error
    const [passwordError, setPasswordError] = useState('');

    // State for reset password confirmation error
    const [resetPasswordError, setResetPasswordError] = useState('');

    // State for forgot password error
    const [forgotPasswordError, setForgotPasswordError] = useState('');

    // State for sign-up form field errors
    const [signUpErrors, setSignUpErrors] = useState({});

    // State to track if the sign-up form is valid
    const [isSignUpFormValid, setIsSignUpFormValid] = useState(false);

    const onLoginInputChange = (e) => {
        // Clear login error when user starts typing
        if (loginError) setLoginError('');
        setLoginCreds({ ...loginCreds, [e.target.name]: e.target.value });
    };

    const onForgotPasswordInputChange = (e) => {
        if (forgotPasswordError) setForgotPasswordError('');
        setForgotPasswordData({ ...forgotPasswordData, [e.target.name]: e.target.value });
    };

    const onInputChange = (e) => {
        // Clear specific error when user types
        if (signUpErrors[e.target.name]) setSignUpErrors(prev => ({ ...prev, [e.target.name]: '' }));
        setUser(prevUser => ({ ...prevUser, [e.target.name]: e.target.value }));
    }

    // Function to validate all sign-up fields
    const validateSignUpForm = () => {
        const { name, username, email, mobileNumber, password, confirmPassword, gender, dob } = user;
        const allFieldsFilled =
            name.trim() !== '' &&
            username.trim() !== '' &&
            email.trim() !== '' &&
            mobileNumber.trim() !== '' &&
            password.trim() !== '' &&
            confirmPassword.trim() !== '' &&
            gender.trim() !== '' &&
            dob !== null && dob !== ''; // dob can be a Date object or null/empty string initially

        // Also consider password mismatch error
        return allFieldsFilled && !passwordError;
    };

    useEffect(() => {
        if (user.confirmPassword && user.password !== user.confirmPassword) {
            setPasswordError("Passwords do not match!");
        } else {
            setPasswordError("");
        }
    }, [user.password, user.confirmPassword]);

    useEffect(() => {
        if (forgotPasswordData.confirmNewPassword && forgotPasswordData.newPassword !== forgotPasswordData.confirmNewPassword) {
            setResetPasswordError("Passwords do not match!");
        } else {
            setResetPasswordError("");
        }
    }, [forgotPasswordData.newPassword, forgotPasswordData.confirmNewPassword]);

    // Effect to re-validate the sign-up form whenever user data or passwordError changes
    useEffect(() => {
        setIsSignUpFormValid(validateSignUpForm());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, passwordError]);

    const onSignUpSubmit = async (e) => {
        e.preventDefault();
        try {
            const { confirmPassword, ...userDataToSend } = user;
            // Format the dob to a 'dd-MM-yyyy' string
            const formattedUserData = {
                ...userDataToSend,
                dob: userDataToSend.dob ? (() => {
                    // Input type date returns YYYY-MM-DD
                    const [year, month, day] = userDataToSend.dob.split('-');
                    return `${day}-${month}-${year}`;
                })() : null
            };

            const response = await axios.post("/signup", formattedUserData);
            // Assuming backend returns { jwt: '...', user: {...} }
            login(response.data.jwt, response.data.user);
            navigate("/");
        } catch (error) {
            if (error.response && error.response.status === 409) {
                let message = error.response.data;
                // The backend sends { "error": "..." }, so we extract it.
                if (typeof message === 'object' && message.error) {
                    message = message.error;
                } else {
                    message = String(message);
                }

                const newErrors = {};
                const lowerCaseMessage = message.toLowerCase();

                // Check for specific keywords and assign a tailored message for each field.
                if (lowerCaseMessage.includes('username')) {
                    newErrors.username = 'Username already exists.';
                }
                if (lowerCaseMessage.includes('email')) {
                    newErrors.email = 'Email already exists.';
                }
                if (lowerCaseMessage.includes('mobile')) {
                    newErrors.mobileNumber = 'Mobile number already exists.';
                }

                setSignUpErrors(newErrors);
            } else {
                console.error("An unexpected error occurred during sign-up:", error);
            }
        }
    }

    const onLoginSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("/login", loginCreds);
            // Assuming backend returns { jwt: '...', user: {...} }
            login(response.data.jwt, response.data.user);
            navigate("/");
        } catch (error) {
            setLoginError(error.response?.data?.message || "Invalid credentials or service unavailable.");
            console.error("Login request failed:", error);
        }
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("/forgot-password", { emailOrMobile: forgotPasswordData.emailOrMobile });
            if (response.data.startsWith("OTP sent to")) {
                setForgotPasswordStep('enterOtp');
            } else {
                setForgotPasswordError("User not found");
            }
        } catch (error) {
            setForgotPasswordError("Service is currently unavailable. Please try again later.");
            console.error("Forgot password request failed:", error);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("/verify-otp", { emailOrMobile: forgotPasswordData.emailOrMobile, otp: forgotPasswordData.otp });
            if (!response.data.startsWith("OTP verified")) {
                setForgotPasswordError(response.data);
            } else {
                setForgotPasswordStep('resetPassword');
                setForgotPasswordError('');
            }

        } catch (error) {
            setForgotPasswordError("Invalid OTP. Please try again.");
            console.error("OTP verification failed:", error);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("/reset-password", { emailOrMobile: forgotPasswordData.emailOrMobile, newPassword: forgotPasswordData.newPassword });
            if (!response.data.startsWith("Password reset successful")) {
                setResetPasswordError(response.data);
                return;
            } else {
                setResetPasswordError('');
                setViewMode('login');
            }
        } catch (error) {
            setResetPasswordError("Password reset failed. Please try again.");
            console.error("Password reset failed:", error);
        }

    };

    const onReset = () => {
        setUser({
            name: "",
            username: "",
            email: "",
            mobileNumber: "",
            password: "",
            confirmPassword: "",
            gender: "",
            dob: ""
        });
        setLoginCreds({ emailOrMobile: '', password: '' });
        setLoginError('');
    };

    return (
        <div className='container d-flex align-items-center justify-content-center' style={{ minHeight: "90vh" }}>
            <div className='row'>
                <div className='col-md-12 modern-form-container'>
                    {viewMode === 'login' && (
                        // Login Form
                        <>
                            <h2 className='text-center m-4'>Login</h2>
                            <form onSubmit={onLoginSubmit} onReset={(e) => { e.preventDefault(); onReset(); }}>
                                <div className='mb-3'>
                                    <div className="input-group">
                                        <span className="input-group-text"><FaUser /></span>
                                        <input type={"text"} className='form-control' placeholder='Mobile Number or Email' name='emailOrMobile' value={loginCreds.emailOrMobile} onChange={onLoginInputChange} />
                                    </div>
                                </div>
                                <div className='mb-3'>
                                    <div className="input-group">
                                        <span className="input-group-text"><FaLock /></span>
                                        <input type={"password"} className='form-control' placeholder='Password' name='password' value={loginCreds.password} onChange={onLoginInputChange} />
                                    </div>
                                    {loginError && <div className="text-danger mt-1" style={{ fontSize: '0.8rem' }}>{loginError}</div>}
                                </div>
                                <div className="text-end toggle-text" style={{ fontSize: '0.9rem' }}>
                                    <Link to="#" onClick={() => setViewMode('forgotPassword')}>Forgot Password?</Link>
                                </div>
                                <div className="d-flex justify-content-center">
                                    <button type='submit' className='btn btn-submit mt-3'>Login</button>
                                </div>
                                <div className="text-center mt-4 toggle-text">
                                    Don't have an account? <Link to="#" onClick={() => setViewMode('signup')}>Sign Up</Link>
                                </div>
                            </form>
                        </>
                    )}

                    {viewMode === 'forgotPassword' && (
                        // Forgot Password Form
                        <>
                            <h2 className='text-center m-4'>Reset Password</h2>
                            <form>
                                {/* Step 1: Enter emailOrMobile */}
                                {forgotPasswordStep === 'enteremailOrMobile' && (
                                    <div className='mb-3'>
                                        <div className="input-group">
                                            <span className="input-group-text"><FaEnvelope /></span>
                                            <input type={"text"} className='form-control' placeholder='Email or Mobile Number' name='emailOrMobile' value={forgotPasswordData.emailOrMobile} onChange={onForgotPasswordInputChange} />
                                        </div>
                                        {forgotPasswordError && <div className="text-danger mt-1" style={{ fontSize: '0.8rem' }}>{forgotPasswordError}</div>}
                                        <div className="d-flex justify-content-center">
                                            <button onClick={handleSendOtp} className='btn btn-submit mt-3'>Send OTP</button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Enter OTP */}
                                {forgotPasswordStep === 'enterOtp' && (
                                    <div className='mb-3'>
                                        <div className="input-group mb-3">
                                            <span className="input-group-text"><FaEnvelope /></span>
                                            <input type={"text"} className='form-control' name='emailOrMobile' value={forgotPasswordData.emailOrMobile} disabled />
                                        </div>
                                        <div className="input-group">
                                            <span className="input-group-text"><FaLock /></span>
                                            <input type={"text"} className='form-control' placeholder='Enter OTP' name='otp' value={forgotPasswordData.otp} onChange={onForgotPasswordInputChange} />
                                        </div>
                                        {forgotPasswordError && <div className="text-danger mt-1" style={{ fontSize: '0.8rem' }}>{forgotPasswordError}</div>}
                                        <div className="d-flex justify-content-center">
                                            <button onClick={handleVerifyOtp} className='btn btn-submit mt-3'>Verify OTP</button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Reset Password */}
                                {forgotPasswordStep === 'resetPassword' && (
                                    <>
                                        <div className="input-group mb-3">
                                            <span className="input-group-text"><FaLock /></span>
                                            <input type={"password"} className='form-control' placeholder='New Password' name='newPassword' value={forgotPasswordData.newPassword} onChange={onForgotPasswordInputChange} />
                                        </div>
                                        <div className="input-group mb-3">
                                            <span className="input-group-text"><FaLock /></span>
                                            <input type={"password"} className='form-control' placeholder='Confirm New Password' name='confirmNewPassword' value={forgotPasswordData.confirmNewPassword} onChange={onForgotPasswordInputChange} />
                                            {resetPasswordError && <div className="text-danger mt-1" style={{ fontSize: '0.8rem' }}>{resetPasswordError}</div>}
                                        </div>
                                        <div className="d-flex justify-content-center">
                                            <button onClick={handleResetPassword} disabled={!!resetPasswordError} className='btn btn-submit mt-3'>Reset Password</button>
                                        </div>
                                    </>
                                )}
                                <div className="text-center mt-4 toggle-text">
                                    Remember your password? <Link to="#" onClick={() => setViewMode('login')}>Login</Link>
                                </div>
                            </form>
                        </>
                    )}

                    {viewMode === 'signup' && (
                        // Sign-Up Form
                        <>
                            <h2 className='text-center m-4'>Create an Account</h2>
                            <form onSubmit={onSignUpSubmit} onReset={(e) => { e.preventDefault(); onReset(); }} >
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
                                        {signUpErrors.username && <div className="text-danger mt-1" style={{ fontSize: '0.8rem' }}>{signUpErrors.username}</div>}
                                    </div>
                                </div>
                                <div className="row">
                                    <div className='col-md-6 mb-2'>
                                        <div className="input-group">
                                            <span className="input-group-text"><FaEnvelope /></span>
                                            <input type={"email"} className='form-control' placeholder='Email' name='email' value={email} onChange={(e) => onInputChange(e)} />
                                        </div>
                                        {signUpErrors.email && <div className="text-danger mt-1" style={{ fontSize: '0.8rem' }}>{signUpErrors.email}</div>}
                                    </div>
                                    <div className='col-md-6 mb-2'>
                                        <div className="input-group">
                                            <span className="input-group-text"><FaMobileAlt /></span>
                                            <input type={"tel"} className='form-control' placeholder='Mobile Number' name='mobileNumber' value={mobileNumber} onChange={(e) => onInputChange(e)} />
                                        </div>
                                        {signUpErrors.mobileNumber && <div className="text-danger mt-1" style={{ fontSize: '0.8rem' }}>{signUpErrors.mobileNumber}</div>}
                                    </div>
                                </div>
                                <div className="row">
                                    <div className='col-md-6 mb-2'>
                                        <div className="input-group">
                                            <span className="input-group-text"><FaCalendarAlt /></span>
                                            <input
                                                type="date"
                                                className='form-control'
                                                placeholder='Date of Birth'
                                                name='dob'
                                                value={dob}
                                                onChange={(e) => onInputChange(e)} />
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
                                <div className="row">
                                    <div className='col-md-6 mb-2'>
                                        <div className="input-group">
                                            <span className="input-group-text"><FaLock /></span>
                                            <input type={"password"} className='form-control' placeholder='Password' name='password' value={password} onChange={(e) => onInputChange(e)} />
                                        </div>
                                    </div>
                                    <div className='col-md-6 mb-2'>
                                        <div className="input-group">
                                            <span className="input-group-text"><FaLock /></span>
                                            <input type={"password"} className='form-control' placeholder='Confirm Password' name='confirmPassword' value={confirmPassword} onChange={(e) => onInputChange(e)} />
                                        </div>
                                        {passwordError && <div className="text-danger mt-1" style={{ fontSize: '0.8rem' }}>{passwordError}</div>}
                                    </div>
                                </div>
                                <div className="d-flex justify-content-center">
                                    <button type='submit' className='btn btn-submit mt-3' disabled={!isSignUpFormValid}>
                                        Sign Up
                                    </button>
                                    <button type='reset' className='btn btn-reset mx-2 mt-3'>Reset</button>
                                </div>
                                <div className="text-center mt-4 toggle-text">
                                    Already have an account? <Link to="#" onClick={() => setViewMode('login')}>Login</Link>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}