import React, { useState } from 'react';
import axios from 'axios';
import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';

function Register({ onRegisterSuccess, onSwitchToLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/register/', { username, password });
            onRegisterSuccess();
            alert("Registration successful! Please login.");
        } catch (err) {
            setError('Registration failed. Username may be taken.');
        }
    };

    return (
        <Container fluid className="d-flex align-items-center justify-content-center vh-100">
            <div className="position-absolute top-0 start-0 w-100 h-100 overflow-hidden" style={{ zIndex: -1 }}>
                <div className="position-absolute bg-success rounded-circle opacity-25 animate-float" style={{ width: '350px', height: '350px', top: '20%', right: '15%', filter: 'blur(90px)' }}></div>
                <div className="position-absolute bg-info rounded-circle opacity-25 animate-float" style={{ width: '250px', height: '250px', bottom: '15%', left: '10%', filter: 'blur(80px)', animationDelay: '1.5s' }}></div>
            </div>

            <Row className="w-100 justify-content-center">
                <Col md={5} lg={4}>
                    <div className="glass-card p-5 animate-fade-in text-center">
                        <div className="mb-4">
                            <h2 className="fw-bold text-white mb-2">Create Account</h2>
                            <p className="text-secondary small">Join us to start visualizing your data.</p>
                        </div>

                        {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

                        <Form onSubmit={handleSubmit} className="text-start">
                            <Form.Group className="mb-3">
                                <Form.Label className="text-secondary small text-uppercase fw-bold">Username</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Choose a username"
                                    required
                                />
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label className="text-secondary small text-uppercase fw-bold">Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Choose a strong password"
                                    required
                                />
                            </Form.Group>

                            <Button variant="primary" type="submit" className="w-100 py-2 mb-3 shadow-lg">
                                Register
                            </Button>
                        </Form>

                        <div className="mt-3">
                            <span className="text-secondary small">Already have an account? </span>
                            <button onClick={onSwitchToLogin} className="btn btn-link text-neon p-0 text-decoration-none fw-bold small">
                                Sign In
                            </button>
                        </div>
                    </div>
                </Col>
            </Row>
        </Container>
    );
}

export default Register;
