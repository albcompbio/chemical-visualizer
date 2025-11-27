Chemical Equipment Parameter Visualizer

Hybrid Web + Desktop Application (Django + React + Electron)

The Chemical Equipment Parameter Visualizer is a hybrid application that runs as both a web application and a desktop application. It allows users to upload chemical equipment datasets, visualize parameters, generate PDF reports, and view their upload history with authentication support.

Features

CSV Upload & Validation

Interactive Visualizations (Pie charts, Summary graphs)

Auto-generated PDF Report

User Login & Authentication

Upload History per user

Delete CSV from history

Hybrid deployment: Web + Desktop (Electron)

Tech Stack

Frontend (Web + Desktop):

React (Vite)

TailwindCSS

Axios

Electron

Backend (API):

Django

Django REST Framework

Pandas / NumPy

Matplotlib

ReportLab (PDF Generator)

Project Structure

chemical-visualizer/
│── backend/ (Django API server)
│── frontend-web/ (React web frontend)
│── frontend-electron/ (Electron desktop wrapper)
│── README.md

How to Run the Application
Run Backend (Django)

cd backend
python manage.py runserver

Backend runs at:
http://127.0.0.1:8000

Run Web Frontend (React)

cd frontend-web
npm install
npm start

Frontend runs at:
http://localhost:3000

Run Desktop Application (Electron)

cd frontend-electron
npm install
npm run dev

Build desktop installer (.exe):

npm run build

The installer will appear inside:
frontend-electron/dist/

Usage

Register or Login

Upload a CSV file

View generated graphs and statistics

Download the PDF report

Check your upload history

Delete old CSV uploads

Important Notes

Do NOT push Electron build files (.exe) or dist folders to GitHub.

Add these to .gitignore:
frontend-electron/dist/
frontend-electron/node_modules/

Troubleshooting

White screen in Electron:
Ensure correct production path in main.js:

mainWindow.loadFile("dist/index.html")

React cannot access backend:
Enable CORS in Django.

PDF shows 0 values:
Ensure numeric columns are converted using:
df = df.apply(pd.to_numeric, errors="coerce")

License

MIT License
