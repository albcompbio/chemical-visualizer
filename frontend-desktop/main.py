import sys
import requests
import matplotlib.pyplot as plt
from matplotlib.backends.backend_qt5agg import FigureCanvasQTAgg as FigureCanvas
from PyQt5.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout, 
                             QTabWidget, QLabel, QPushButton, QFileDialog, 
                             QTableWidget, QTableWidgetItem, QMessageBox, QHBoxLayout,
                             QDialog, QLineEdit, QFormLayout)
from PyQt5.QtCore import Qt

API_URL = "http://localhost:8000/api/"
TOKEN = None

class RegisterDialog(QDialog):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Register")
        self.setGeometry(350, 350, 300, 150)
        layout = QFormLayout()
        
        self.username = QLineEdit()
        self.password = QLineEdit()
        self.password.setEchoMode(QLineEdit.Password)
        
        layout.addRow("Username:", self.username)
        layout.addRow("Password:", self.password)
        
        self.btn_register = QPushButton("Register")
        self.btn_register.clicked.connect(self.register)
        layout.addWidget(self.btn_register)
        
        self.setLayout(layout)
        
    def register(self):
        username = self.username.text()
        password = self.password.text()
        try:
            response = requests.post(API_URL + 'register/', data={'username': username, 'password': password})
            if response.status_code == 201:
                QMessageBox.information(self, "Success", "Registration successful! Please login.")
                self.accept()
            else:
                QMessageBox.warning(self, "Error", f"Registration failed: {response.json().get('error', 'Unknown error')}")
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Connection failed: {e}")

class LoginDialog(QDialog):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Login")
        self.setGeometry(300, 300, 300, 200)
        layout = QFormLayout()
        
        self.username = QLineEdit()
        self.password = QLineEdit()
        self.password.setEchoMode(QLineEdit.Password)
        
        layout.addRow("Username:", self.username)
        layout.addRow("Password:", self.password)
        
        self.btn_login = QPushButton("Login")
        self.btn_login.clicked.connect(self.login)
        layout.addWidget(self.btn_login)

        self.btn_register = QPushButton("Register New Account")
        self.btn_register.clicked.connect(self.open_register)
        layout.addWidget(self.btn_register)
        
        self.setLayout(layout)
        
    def login(self):
        global TOKEN
        username = self.username.text()
        password = self.password.text()
        try:
            response = requests.post(API_URL + 'token/', data={'username': username, 'password': password})
            if response.status_code == 200:
                TOKEN = response.json()['access']
                self.accept()
            else:
                QMessageBox.warning(self, "Error", "Invalid credentials")
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Connection failed: {e}")

    def open_register(self):
        dialog = RegisterDialog()
        dialog.exec_()

class UploadTab(QWidget):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout()
        
        self.label = QLabel("Select a CSV file to upload")
        layout.addWidget(self.label)
        
        self.btn_upload = QPushButton("Upload CSV")
        self.btn_upload.clicked.connect(self.upload_file)
        layout.addWidget(self.btn_upload)
        
        self.setLayout(layout)

    def upload_file(self):
        if not TOKEN:
            QMessageBox.warning(self, "Error", "Not logged in")
            return

        fname, _ = QFileDialog.getOpenFileName(self, 'Open file', 'c:\\', "CSV files (*.csv)")
        if fname:
            try:
                files = {'file': open(fname, 'rb')}
                headers = {'Authorization': f'Bearer {TOKEN}'}
                response = requests.post(API_URL + 'upload/', files=files, headers=headers)
                if response.status_code == 201:
                    QMessageBox.information(self, "Success", "File uploaded successfully!")
                else:
                    QMessageBox.warning(self, "Error", f"Upload failed: {response.text}")
            except Exception as e:
                QMessageBox.critical(self, "Error", str(e))

class HistoryTab(QWidget):
    def __init__(self, visuals_tab):
        super().__init__()
        self.visuals_tab = visuals_tab
        layout = QVBoxLayout()
        
        self.btn_refresh = QPushButton("Refresh")
        self.btn_refresh.clicked.connect(self.load_history)
        layout.addWidget(self.btn_refresh)
        
        self.table = QTableWidget()
        self.table.setColumnCount(5)
        self.table.setHorizontalHeaderLabels(["ID", "Filename", "Date", "Visualize", "PDF"])
        layout.addWidget(self.table)
        
        self.setLayout(layout)
        self.data = []
        
    def load_history(self):
        if not TOKEN:
            return
        try:
            headers = {'Authorization': f'Bearer {TOKEN}'}
            response = requests.get(API_URL + 'history/', headers=headers)
            if response.status_code == 200:
                self.data = response.json()
                self.table.setRowCount(len(self.data))
                for i, row in enumerate(self.data):
                    self.table.setItem(i, 0, QTableWidgetItem(str(row['id'])))
                    self.table.setItem(i, 1, QTableWidgetItem(row['filename']))
                    self.table.setItem(i, 2, QTableWidgetItem(row['uploaded_at']))
                    
                    btn_viz = QPushButton("Visualize")
                    btn_viz.clicked.connect(lambda checked, r=row: self.visuals_tab.plot_data(r))
                    self.table.setCellWidget(i, 3, btn_viz)

                    btn_pdf = QPushButton("Download PDF")
                    btn_pdf.clicked.connect(lambda checked, r=row: self.download_pdf(r))
                    self.table.setCellWidget(i, 4, btn_pdf)
            else:
                QMessageBox.warning(self, "Error", "Failed to fetch history")
        except Exception as e:
            print(f"Error loading history: {e}")

    def download_pdf(self, row):
        try:
            headers = {'Authorization': f'Bearer {TOKEN}'}
            response = requests.get(API_URL + f"history/{row['id']}/pdf/", headers=headers)
            if response.status_code == 200:
                path, _ = QFileDialog.getSaveFileName(self, "Save PDF", f"{row['filename']}_report.pdf", "PDF Files (*.pdf)")
                if path:
                    with open(path, 'wb') as f:
                        f.write(response.content)
                    QMessageBox.information(self, "Success", "PDF saved successfully!")
            else:
                QMessageBox.warning(self, "Error", "Failed to download PDF")
        except Exception as e:
            QMessageBox.critical(self, "Error", str(e))

class VisualsTab(QWidget):
    def __init__(self):
        super().__init__()
        self.layout = QVBoxLayout()
        self.figure = plt.figure()
        self.canvas = FigureCanvas(self.figure)
        self.layout.addWidget(self.canvas)
        self.setLayout(self.layout)
    
    def plot_data(self, data):
        self.figure.clear()
        
        # Plot 1: Distribution Pie Chart
        ax1 = self.figure.add_subplot(121)
        dist = data['summary'].get('distribution', {})
        if dist:
            ax1.pie(dist.values(), labels=dist.keys(), autopct='%1.1f%%')
            ax1.set_title(f"Distribution: {data['filename']}")
        
        # Plot 2: Averages Bar Chart
        ax2 = self.figure.add_subplot(122)
        avgs = data['summary'].get('averages', {})
        if avgs:
            ax2.bar(avgs.keys(), avgs.values())
            ax2.set_title("Average Values")
            ax2.tick_params(axis='x', rotation=45)
        
        self.canvas.draw()
        
        # Switch to this tab
        parent = self.parentWidget()
        if isinstance(parent, QTabWidget):
            parent.setCurrentWidget(self)

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Chemical Visualizer Desktop")
        self.setGeometry(100, 100, 1000, 700)

        self.tabs = QTabWidget()
        self.setCentralWidget(self.tabs)

        self.visuals_tab = VisualsTab()
        self.upload_tab = UploadTab()
        self.history_tab = HistoryTab(self.visuals_tab)

        self.tabs.addTab(self.upload_tab, "Upload")
        self.tabs.addTab(self.history_tab, "History")
        self.tabs.addTab(self.visuals_tab, "Visuals")
        
        # Show Login Dialog
        login = LoginDialog()
        if login.exec_() != QDialog.Accepted:
            sys.exit()

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec_())
