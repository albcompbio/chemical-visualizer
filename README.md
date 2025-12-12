Chemical Equipment Parameter Visualizer
Hybrid Web + Desktop Application (Django + React + Electron)

![Python](https://img.shields.io/badge/Python-3.10%2B-blue)
![Django](https://img.shields.io/badge/Django-Backend-0C4B33)
![DRF](https://img.shields.io/badge/DRF-API%20Framework-red)
![React](https://img.shields.io/badge/React-Frontend-61DAFB)
![Electron](https://img.shields.io/badge/Electron-Desktop%20App-2f3241)
![Vite](https://img.shields.io/badge/Vite-Bundler-purple)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-UI%20Styling-38B2AC)
![Pandas](https://img.shields.io/badge/Pandas-Data%20Processing-150458)
![NumPy](https://img.shields.io/badge/NumPy-Numerical%20Computing-013243)
![Matplotlib](https://img.shields.io/badge/Matplotlib-Visualization-orange)
![ReportLab](https://img.shields.io/badge/ReportLab-PDF%20Generation-yellow)
![SQLite](https://img.shields.io/badge/SQLite-Local%20DB-003B57)

A powerful hybrid application designed for chemical engineers and data analysts to upload equipment datasets, visualize parameter trends, generate PDF reports, and manage historical data — all available both on web and desktop.

Features

- CSV Upload & Auto-Validation

- Interactive Visualizations (Pie charts, parameter distributions, summary plots)

- Auto-Generated PDF Reports

- User Authentication (Register/Login)

- User-Specific Upload History

- Delete CSV from History

- Hybrid Deployment: Web App + Desktop App (Electron)

- Fast UI powered by React + Vite

Tech Stack
Frontend:

React (Vite)

TailwindCSS

Axios

Electron

Backend:

Django

Django REST Framework

Pandas, NumPy

Matplotlib

ReportLab

📂 Project Structure

chemical-visualizer/
│── backend/                # Django API server
│── frontend-web/           # React frontend (web)
│── frontend-electron/      # Electron desktop wrapper
│── README.md

How to Run the Application

1️⃣ Backend (Django)
cd backend
pip install -r requirements.txt
python manage.py runserver


Backend URL:
👉 http://127.0.0.1:8000

2️⃣ Web Frontend (React)
cd frontend-web
npm install
npm start


Frontend URL:
👉 http://localhost:3000

3️⃣ Desktop App (Electron)
cd frontend-electron
npm install
npm run dev

Build Desktop Installer (.exe)
npm run build


Installer will appear in:
frontend-electron/dist/

How to Use

- Login / Register

- Upload a CSV file containing chemical equipment data

- View automatically generated graphs

- Download the PDF report

- Check history of previously uploaded files

- Delete unwanted files from history

- PDF Report Includes

File metadata (name, upload time)

Summary statistics for all numeric parameters

Parameter distribution charts

Equipment category breakdown

Visual insights for decision-making

⚠️ Important Notes

❗ Do NOT commit large files or Electron build output.
Add these to .gitignore:

frontend-electron/dist/
frontend-electron/node_modules/
*.exe


If backend values show 0.00, convert numeric fields properly:

df = df.apply(pd.to_numeric, errors="coerce")


For Electron white-screen issues:
Ensure:

mainWindow.loadFile("dist/index.html")

Troubleshooting Guide
Problem	Fix
React can't connect to backend	Enable Django CORS
Electron opens blank white screen	Fix loadFile path
Git push rejected due to large files	Use Git LFS and remove build folders
PDF shows empty stats	Cast numeric columns before summary

License

This project is licensed under the MIT License.
