import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Table, Button, Form, Alert, Badge } from 'react-bootstrap';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import Login from './Login';
import Register from './Register';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

function App() {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [showRegister, setShowRegister] = useState(false);
    const [dataSets, setDataSets] = useState([]);
    const [selectedData, setSelectedData] = useState(null);
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState(false);

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            fetchHistory();
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    // Chart.js Dark Theme Config
    ChartJS.defaults.color = '#94a3b8';
    ChartJS.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';

    const handleLogin = (newToken) => {
        setToken(newToken);
        localStorage.setItem('token', newToken);
    };

    const handleLogout = () => {
        setToken(null);
        localStorage.removeItem('token');
        setDataSets([]);
        setSelectedData(null);
    };

    const fetchHistory = async () => {
        try {
            const response = await axios.get('/api/history/');
            setDataSets(response.data);
        } catch (error) {
            console.error("Error fetching history", error);
            if (error.response && error.response.status === 401) handleLogout();
        }
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setUploadSuccess(false);
        setMessage('');
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await axios.post('/api/upload/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage('Upload successful! Your data is now visualized below.');
            setUploadSuccess(true);
            fetchHistory();
            setSelectedData(response.data);
        } catch (error) {
            setMessage('Upload failed.');
            setUploadSuccess(false);
            console.error(error);
        }
    };

    const loadData = (data) => {
        setSelectedData(data);
        setUploadSuccess(false);
        setMessage('');
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this file?")) return;

        try {
            await axios.delete(`/api/history/${id}/`);
            setMessage('File deleted successfully.');
            setUploadSuccess(true);
            fetchHistory();
            if (selectedData && selectedData.id === id) {
                setSelectedData(null);
            }
        } catch (error) {
            console.error("Error deleting file", error);
            setMessage('Failed to delete file.');
            setUploadSuccess(false);
        }
    };

    const downloadPDF = async () => {
        if (!selectedData) return;
        try {
            const response = await axios.get(`/api/history/${selectedData.id}/pdf/`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${selectedData.filename}_report.pdf`);
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            console.error("Error downloading PDF", error);
            alert("Failed to download PDF");
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone and all your data will be lost.")) return;
        try {
            await axios.delete('/api/delete-account/');
            alert("Account deleted successfully.");
            handleLogout();
        } catch (error) {
            console.error("Error deleting account", error);
            alert("Failed to delete account.");
        }
    };

    // Helper to format stats table
    const renderStatsTable = (stats) => {
        if (!stats) return null;
        const columns = Object.keys(stats['count'] || {});

        return (
            <Table responsive className="table-dark-glass mb-0">
                <thead>
                    <tr>
                        <th>Parameter</th>
                        <th>Count</th>
                        <th>Min</th>
                        <th>Max</th>
                        <th>Average</th>
                    </tr>
                </thead>
                <tbody>
                    {columns.map(col => (
                        <tr key={col}>
                            <td className="fw-bold text-neon">{col}</td>
                            <td>{stats['count'][col]}</td>
                            <td>{stats['min'][col] != null ? stats['min'][col].toFixed(2) : '-'}</td>
                            <td>{stats['max'][col] != null ? stats['max'][col].toFixed(2) : '-'}</td>
                            <td>
                                <Badge bg="info" className="text-dark fw-bold">
                                    {stats['mean'][col] != null ? stats['mean'][col].toFixed(2) : '-'}
                                </Badge>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        );
    };

    if (!token) {
        if (showRegister) {
            return <Register onRegisterSuccess={() => setShowRegister(false)} onSwitchToLogin={() => setShowRegister(false)} />;
        }
        return <Login onLogin={handleLogin} onSwitchToRegister={() => setShowRegister(true)} />;
    }

    return (
        <Container fluid className="p-4">
            {/* Background Animation Elements */}
            <div className="position-fixed top-0 start-0 w-100 h-100 overflow-hidden" style={{ zIndex: -1, pointerEvents: 'none' }}>
                <div className="position-absolute bg-primary rounded-circle opacity-10 animate-float" style={{ width: '600px', height: '600px', top: '-10%', right: '-10%', filter: 'blur(120px)' }}></div>
                <div className="position-absolute bg-info rounded-circle opacity-10 animate-float" style={{ width: '500px', height: '500px', bottom: '-10%', left: '-10%', filter: 'blur(100px)', animationDelay: '3s' }}></div>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-5 animate-fade-in">
                <div className="d-flex align-items-center">
                    <div className="bg-primary rounded-circle p-2 me-3 shadow-lg">
                        <i className="bi bi-hexagon-fill text-white fs-4"></i>
                    </div>
                    <div>
                        <h2 className="fw-bold m-0 text-white">Chemical Visualizer</h2>
                        <small className="text-secondary">Advanced Equipment Analytics</small>
                    </div>
                </div>
                <div>
                    <Button variant="outline-danger" className="me-3 btn-neon border-danger text-danger" onClick={handleDeleteAccount}>
                        <i className="bi bi-trash me-2"></i>Delete Account
                    </Button>
                    <Button variant="outline-light" className="btn-neon" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-2"></i>Logout
                    </Button>
                </div>
            </div>

            {message && (
                <Alert variant={uploadSuccess ? "success" : "danger"} className="text-center glass-card border-0 text-white mb-4">
                    {message}
                </Alert>
            )}

            <Row>
                {/* Sidebar: Upload & History */}
                <Col md={3} className="mb-4">
                    <div className="glass-card p-4 mb-4 animate-fade-in">
                        <h5 className="text-neon mb-3 text-uppercase small fw-bold">Upload Data</h5>
                        <Form onSubmit={handleUpload}>
                            <Form.Group className="mb-3">
                                <Form.Control type="file" onChange={handleFileChange} accept=".csv" className="bg-transparent text-white border-secondary" />
                                <Form.Text className="text-secondary small">
                                    Select a .csv file to analyze.
                                </Form.Text>
                            </Form.Group>
                            <Button variant="primary" type="submit" className="w-100 btn-primary shadow-lg">
                                <i className="bi bi-cloud-upload me-2"></i>Visualize
                            </Button>
                        </Form>
                    </div>

                    <div className="glass-card p-0 overflow-hidden animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        <div className="p-3 border-bottom border-secondary border-opacity-25 bg-dark bg-opacity-25">
                            <h5 className="text-neon m-0 text-uppercase small fw-bold">History</h5>
                        </div>
                        <div className="p-2">
                            {dataSets.length === 0 ? (
                                <p className="text-center text-secondary my-3 small">No history found.</p>
                            ) : (
                                <Table hover className="table-dark-glass mb-0">
                                    <tbody>
                                        {dataSets.map(ds => (
                                            <tr key={ds.id} className={selectedData && selectedData.id === ds.id ? "bg-primary bg-opacity-10" : ""}>
                                                <td className="align-middle border-0">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <div className="text-truncate" style={{ maxWidth: '140px' }} title={ds.filename}>
                                                            <span className="d-block text-white small fw-bold">{ds.filename}</span>
                                                            <small className="text-secondary" style={{ fontSize: '0.7rem' }}>{new Date(ds.uploaded_at).toLocaleDateString()}</small>
                                                        </div>
                                                        <div>
                                                            <Button size="sm" variant="link" className="text-info p-1" onClick={() => loadData(ds)}><i className="bi bi-eye"></i></Button>
                                                            <Button size="sm" variant="link" className="text-danger p-1" onClick={(e) => handleDelete(ds.id, e)}><i className="bi bi-trash"></i></Button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </div>
                    </div>
                </Col>

                {/* Main Dashboard */}
                <Col md={9}>
                    {selectedData && selectedData.summary ? (
                        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                            <div className="glass-card p-4 mb-4 d-flex justify-content-between align-items-center">
                                <div>
                                    <h3 className="m-0 text-white">Dashboard: <span className="text-neon">{selectedData.filename}</span></h3>
                                    <small className="text-secondary">Uploaded: {new Date(selectedData.uploaded_at).toLocaleString()}</small>
                                </div>
                                <Button variant="success" className="btn-primary" onClick={downloadPDF}>
                                    <i className="bi bi-file-earmark-pdf me-2"></i>Download Report
                                </Button>
                            </div>

                            <Row>
                                {/* Equipment Distribution Pie Chart */}
                                <Col md={6} className="mb-4">
                                    <div className="glass-card p-4 h-100">
                                        <h5 className="text-white mb-2">Equipment Distribution</h5>
                                        <p className="text-secondary small mb-3">Breakdown of equipment types found in the uploaded dataset.</p>
                                        <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
                                            {selectedData.summary.distribution && (
                                                <Pie data={{
                                                    labels: Object.keys(selectedData.summary.distribution),
                                                    datasets: [{
                                                        data: Object.values(selectedData.summary.distribution),
                                                        backgroundColor: [
                                                            'rgba(6, 182, 212, 0.8)',  // Cyan
                                                            'rgba(59, 130, 246, 0.8)', // Blue
                                                            'rgba(168, 85, 247, 0.8)', // Purple
                                                            'rgba(236, 72, 153, 0.8)', // Pink
                                                            'rgba(249, 115, 22, 0.8)', // Orange
                                                            'rgba(34, 197, 94, 0.8)'   // Green
                                                        ],
                                                        borderColor: 'rgba(15, 23, 42, 1)', // Dark border matching bg
                                                        borderWidth: 2,
                                                        hoverOffset: 10
                                                    }]
                                                }} options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: {
                                                        legend: {
                                                            position: 'right',
                                                            labels: {
                                                                color: '#e2e8f0',
                                                                font: { family: "'Inter', sans-serif", size: 12 }
                                                            }
                                                        },
                                                        tooltip: {
                                                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                                            titleColor: '#fff',
                                                            bodyColor: '#cbd5e1',
                                                            borderColor: 'rgba(255,255,255,0.1)',
                                                            borderWidth: 1
                                                        }
                                                    }
                                                }} />
                                            )}
                                        </div>
                                    </div>
                                </Col>

                                {/* Average Parameters Bar Chart */}
                                <Col md={6} className="mb-4">
                                    <div className="glass-card p-4 h-100">
                                        <h5 className="text-white mb-2">Average Parameters</h5>
                                        <p className="text-secondary small mb-3">Comparison of mean values for key parameters across equipment.</p>
                                        <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
                                            {selectedData.summary.averages_by_equipment && (
                                                <Bar data={{
                                                    labels: Object.keys(selectedData.summary.averages_by_equipment),
                                                    datasets: Object.keys(Object.values(selectedData.summary.averages_by_equipment)[0] || {}).map((param, index) => ({
                                                        label: param,
                                                        data: Object.values(selectedData.summary.averages_by_equipment).map(item => item[param]),
                                                        backgroundColor: [
                                                            'rgba(59, 130, 246, 0.7)',
                                                            'rgba(6, 182, 212, 0.7)',
                                                            'rgba(168, 85, 247, 0.7)'
                                                        ][index % 3],
                                                        borderColor: 'rgba(255,255,255,0.1)',
                                                        borderWidth: 0,
                                                        borderRadius: 4,
                                                        barPercentage: 0.7
                                                    }))
                                                }} options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: {
                                                        legend: { position: 'bottom', labels: { color: '#e2e8f0' } },
                                                        tooltip: {
                                                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                                            titleColor: '#fff',
                                                            bodyColor: '#cbd5e1',
                                                            borderColor: 'rgba(255,255,255,0.1)',
                                                            borderWidth: 1
                                                        }
                                                    },
                                                    scales: {
                                                        y: {
                                                            beginAtZero: true,
                                                            grid: { color: 'rgba(255,255,255,0.05)' },
                                                            ticks: { color: '#94a3b8' },
                                                            border: { display: false }
                                                        },
                                                        x: {
                                                            grid: { display: false },
                                                            ticks: { color: '#94a3b8' },
                                                            border: { display: false }
                                                        }
                                                    }
                                                }} />
                                            )}
                                        </div>
                                    </div>
                                </Col>
                            </Row>

                            {/* Histograms */}
                            {selectedData.summary.histograms && (
                                <Row className="mb-4">
                                    <Col>
                                        <div className="glass-card p-4">
                                            <h5 className="text-white mb-2">Parameter Distributions</h5>
                                            <p className="text-secondary small mb-4">Frequency distribution histograms for analyzed parameters.</p>
                                            <Row>
                                                {Object.entries(selectedData.summary.histograms).map(([param, data], idx) => (
                                                    <Col md={4} key={param} className="mb-3">
                                                        <h6 className="text-secondary text-center small text-uppercase mb-1">{param}</h6>
                                                        <p className="text-muted text-center x-small mb-2" style={{ fontSize: '0.7rem' }}>Distribution of {param.toLowerCase()} values.</p>
                                                        <div style={{ height: '150px' }}>
                                                            <Bar data={{
                                                                labels: data.bins.slice(0, -1).map(b => b.toFixed(1)),
                                                                datasets: [{
                                                                    label: 'Frequency',
                                                                    data: data.counts,
                                                                    backgroundColor: 'rgba(6, 182, 212, 0.5)',
                                                                    borderColor: 'rgba(6, 182, 212, 1)',
                                                                    borderWidth: 1,
                                                                    hoverBackgroundColor: 'rgba(6, 182, 212, 0.8)',
                                                                    borderRadius: 2,
                                                                    barPercentage: 0.9,
                                                                    categoryPercentage: 0.9
                                                                }]
                                                            }} options={{
                                                                responsive: true,
                                                                maintainAspectRatio: false,
                                                                plugins: { legend: { display: false } },
                                                                scales: {
                                                                    x: {
                                                                        display: true,
                                                                        grid: { display: false },
                                                                        ticks: {
                                                                            color: '#94a3b8',
                                                                            font: { size: 10 },
                                                                            maxRotation: 45,
                                                                            minRotation: 45
                                                                        }
                                                                    },
                                                                    y: {
                                                                        display: true,
                                                                        grid: { color: 'rgba(255,255,255,0.05)' },
                                                                        ticks: { color: '#94a3b8', font: { size: 10 } }
                                                                    }
                                                                }
                                                            }} />
                                                        </div>
                                                    </Col>
                                                ))}
                                            </Row>
                                        </div>
                                    </Col>
                                </Row>
                            )}

                            <Row>
                                {/* Summary Statistics Table */}
                                <Col md={12} className="mb-4">
                                    <div className="glass-card p-4">
                                        <h5 className="text-white mb-2">Summary Statistics</h5>
                                        <p className="text-secondary small mb-3">Detailed statistical metrics (Count, Min, Max, Average) for all numeric columns.</p>
                                        {renderStatsTable(selectedData.summary.stats)}
                                    </div>
                                </Col>
                            </Row>

                            {/* Data Preview Table */}
                            <Row>
                                <Col>
                                    <div className="glass-card p-4">
                                        <h5 className="text-white mb-3">Data Preview (First 100 Rows)</h5>
                                        <div className="table-responsive" style={{ maxHeight: '400px' }}>
                                            <Table hover size="sm" className="table-dark-glass mb-0">
                                                <thead>
                                                    <tr>
                                                        {selectedData.summary.columns.map(col => <th key={col}>{col}</th>)}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedData.summary.preview && selectedData.summary.preview.map((row, idx) => (
                                                        <tr key={idx}>
                                                            {selectedData.summary.columns.map(col => <td key={col}>{row[col]}</td>)}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    ) : (
                        <div className="glass-card p-5 text-center animate-fade-in d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '400px' }}>
                            <div className="bg-dark bg-opacity-50 rounded-circle p-4 mb-3">
                                <i className="bi bi-bar-chart-line text-secondary fs-1"></i>
                            </div>
                            <h3 className="text-white">Ready to Analyze?</h3>
                            <p className="text-secondary">Upload a CSV file or select a dataset from the history to get started.</p>
                        </div>
                    )}
                </Col>
            </Row>
            <div style={{ position: 'fixed', bottom: '10px', right: '20px', color: 'rgba(255,255,255,0.5)', fontSize: '1.8rem', fontFamily: "'Great Vibes', cursive", pointerEvents: 'none', zIndex: 1000 }}>
                by Aleta Binu
            </div>
        </Container>
    );
}

export default App;
