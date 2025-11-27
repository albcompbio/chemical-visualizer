import React, { useState } from 'react';
import axios from 'axios';
import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';

function Login({ onLogin, onSwitchToRegister }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/token/', { username, password });
            onLogin(response.data.access);
        } catch (err) {
            setError('Invalid credentials');
        }
    };

    return (
        <Container fluid className="d-flex align-items-center justify-content-center vh-100">
            <div className="position-absolute top-0 start-0 w-100 h-100 overflow-hidden" style={{ zIndex: -1 }}>
                {/* Floating blobs for background animation */}
                <div className="position-absolute bg-info rounded-circle opacity-25 animate-float" style={{ width: '300px', height: '300px', top: '10%', left: '10%', filter: 'blur(80px)' }}></div>
                <div className="position-absolute bg-primary rounded-circle opacity-25 animate-float" style={{ width: '400px', height: '400px', bottom: '10%', right: '10%', filter: 'blur(100px)', animationDelay: '2s' }}></div>
            </div>

            <Row className="w-100 justify-content-center">
                <Col md={5} lg={4}>
                    <div className="glass-card p-5 animate-fade-in text-center">
                        <div className="mb-4">
                            <h2 className="fw-bold text-white mb-2">Welcome Back</h2>
                            <p className="text-secondary small">Sign in to access your chemical equipment analytics.</p>
                        </div>

                        {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

                        <Form onSubmit={handleSubmit} className="text-start">
                            <Form.Group className="mb-3">
                                <Form.Label className="text-secondary small text-uppercase fw-bold">Username</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your username"
                                    required
                                />
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label className="text-secondary small text-uppercase fw-bold">Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                />
                            </Form.Group>

                            <Button variant="primary" type="submit" className="w-100 py-2 mb-3 shadow-lg">
                                Sign In
                            </Button>
                        </Form>

                        <div className="mt-3">
                            <span className="text-secondary small">New here? </span>
                            <button onClick={onSwitchToRegister} className="btn btn-link text-neon p-0 text-decoration-none fw-bold small">
                                Create an account
                            </button>
                        </div>

                        <div className="mt-4 pt-3 border-top border-secondary opacity-25">
                            <p className="text-muted small fst-italic m-0">"A smart way to visualize and analyze chemical equipment datasets."</p>
                        </div>
                    </div>
                </Col>
            </Row>
            <div style={{ position: 'fixed', bottom: '10px', right: '20px', color: 'rgba(255,255,255,0.5)', fontSize: '1.8rem', fontFamily: "'Great Vibes', cursive", pointerEvents: 'none', zIndex: 1000 }}>
                by Aleta Binu
            </div>
        </Container>
    );
}

export default Login;
