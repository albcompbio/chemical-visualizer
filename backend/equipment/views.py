from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import DataSet
from .serializers import DataSetSerializer
import pandas as pd
import io
from django.http import HttpResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

class ApiRootView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        return Response({
            'status': 'API is running',
            'endpoints': {
                'upload': '/api/upload/',
                'history': '/api/history/',
                'token': '/api/token/',
                'token_refresh': '/api/token/refresh/',
            }
        })

import numpy as np

class UploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            df = pd.read_csv(file)
            
            # Large Data Handling: Downsample for visualization if too large
            downsampled = df
            if len(df) > 1000:
                downsampled = df.iloc[::len(df)//1000] # Keep approx 1000 points

            # Advanced Analysis
            numeric_df = df.select_dtypes(include=['number'])
            
            # Histograms for numeric columns
            histograms = {}
            for col in numeric_df.columns:
                counts, bin_edges = np.histogram(numeric_df[col].dropna(), bins=10)
                histograms[col] = {'counts': counts.tolist(), 'bins': bin_edges.tolist()}

            # Averages by Equipment (assuming first column is equipment type)
            averages_by_equipment = {}
            if not df.empty:
                first_col = df.columns[0]
                # Group by first column and calculate mean of numeric columns
                grouped = df.groupby(first_col)[numeric_df.columns].mean()
                averages_by_equipment = grouped.to_dict(orient='index')

            summary = {
                'columns': list(df.columns),
                'rows': len(df),
                'stats': numeric_df.describe().T.fillna(0).to_dict(),
                'averages': df.mean(numeric_only=True).to_dict(),
                'distribution': df.iloc[:, 0].value_counts().to_dict() if not df.empty else {},
                'preview': df.head(100).fillna('').to_dict(orient='records'),
                'downsampled': downsampled.select_dtypes(include=['number']).fillna(0).to_dict(orient='list'),
                'histograms': histograms,
                'averages_by_equipment': averages_by_equipment
            }
            
            dataset = DataSet.objects.create(
                user=request.user,
                filename=file.name,
                summary=summary
            )

            # History Limit: Keep only last 5 for THIS user
            ids = DataSet.objects.filter(user=request.user).order_by('-uploaded_at').values_list('id', flat=True)
            if len(ids) > 5:
                DataSet.objects.filter(id__in=ids[5:]).delete()

            return Response(DataSetSerializer(dataset).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            with open('upload_debug.log', 'a') as f:
                f.write(f"Upload error: {str(e)}\n")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class HistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        # Filter by current user
        datasets = DataSet.objects.filter(user=request.user).order_by('-uploaded_at')[:5]
        serializer = DataSetSerializer(datasets, many=True)
        return Response(serializer.data)

class DeleteDataSetView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def delete(self, request, pk):
        try:
            # Ensure user owns the dataset
            dataset = DataSet.objects.get(pk=pk, user=request.user)
            dataset.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except DataSet.DoesNotExist:
            return Response({'error': 'File not found or access denied'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            with open('delete_debug.log', 'a') as f:
                f.write(f"Delete error for pk={pk}: {str(e)}\n")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from django.contrib.auth.models import User

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        if not username or not password:
            return Response({'error': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.create_user(username=username, password=password)
        return Response({'status': 'User created'}, status=status.HTTP_201_CREATED)

class DeleteAccountView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def delete(self, request):
        user = request.user
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

class GeneratePDFView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request, pk):
        with open('pdf_debug.log', 'a') as f:
            f.write(f"PDF Request for pk={pk}, user={request.user}\n")
            
        import matplotlib.pyplot as plt
        import matplotlib
        matplotlib.use('Agg')
        try:
            # Ensure user owns the dataset
            dataset = DataSet.objects.get(pk=pk, user=request.user)
            response = HttpResponse(content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{dataset.filename}_report.pdf"'

            doc = SimpleDocTemplate(response, pagesize=letter)
            styles = getSampleStyleSheet()
            story = []

            # Title
            title_style = styles['Title']
            story.append(Paragraph(f"Report for: {dataset.filename}", title_style))
            story.append(Spacer(1, 12))
            story.append(Paragraph(f"Uploaded at: {dataset.uploaded_at.strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
            story.append(Spacer(1, 24))

            # 1. Equipment Distribution (Pie Chart)
            story.append(Paragraph("1. Equipment Distribution", styles['Heading2']))
            if dataset.summary.get('distribution'):
                dist_data = dataset.summary['distribution']
                plt.figure(figsize=(6, 4))
                plt.pie(dist_data.values(), labels=dist_data.keys(), autopct='%1.1f%%')
                plt.title('Equipment Distribution')
                
                img_buffer = io.BytesIO()
                plt.savefig(img_buffer, format='png')
                img_buffer.seek(0)
                story.append(Image(img_buffer, width=400, height=300))
                plt.close()
                story.append(Paragraph("Figure 1: Proportion of different equipment types found in the dataset.", styles['Italic']))
            story.append(Spacer(1, 24))

            # 2. Average Parameters by Equipment (Bar Chart)
            story.append(Paragraph("2. Average Parameters by Equipment", styles['Heading2']))
            if dataset.summary.get('averages_by_equipment'):
                avg_data = dataset.summary['averages_by_equipment']
                equip_types = list(avg_data.keys())
                if equip_types:
                    params = list(avg_data[equip_types[0]].keys())
                    
                    # Create a bar chart for each parameter or a grouped bar chart
                    # For simplicity in PDF, let's do one grouped chart or subplots. 
                    # Let's do a grouped bar chart for the first 3 numeric params
                    params = params[:3] 
                    
                    x = np.arange(len(equip_types))
                    width = 0.25
                    
                    plt.figure(figsize=(8, 5))
                    for i, param in enumerate(params):
                        vals = [avg_data[et][param] for et in equip_types]
                        plt.bar(x + i*width, vals, width, label=param)
                    
                    plt.xlabel('Equipment Type')
                    plt.ylabel('Average Value')
                    plt.title('Average Parameters by Equipment')
                    plt.xticks(x + width, equip_types, rotation=45, ha='right')
                    plt.legend()
                    plt.tight_layout()

                    img_buffer = io.BytesIO()
                    plt.savefig(img_buffer, format='png')
                    img_buffer.seek(0)
                    story.append(Image(img_buffer, width=500, height=350))
                    plt.close()
                    story.append(Paragraph("Figure 2: Comparison of average parameter values across equipment types.", styles['Italic']))
            story.append(Spacer(1, 24))

            # 3. Parameter Distributions (Histograms)
            story.append(Paragraph("3. Parameter Distributions", styles['Heading2']))
            if dataset.summary.get('histograms'):
                hist_data = dataset.summary['histograms']
                for param, data in hist_data.items():
                    # Reconstruct histogram from bins and counts
                    bins = data['bins']
                    counts = data['counts']
                    
                    plt.figure(figsize=(6, 3))
                    plt.bar(bins[:-1], counts, width=np.diff(bins), align='edge')
                    plt.title(f'Distribution of {param}')
                    plt.xlabel(param)
                    plt.ylabel('Frequency')
                    plt.tight_layout()

                    img_buffer = io.BytesIO()
                    plt.savefig(img_buffer, format='png')
                    img_buffer.seek(0)
                    story.append(Image(img_buffer, width=400, height=200))
                    plt.close()
                    story.append(Spacer(1, 12))
                story.append(Paragraph("Figure 3: Histograms showing the spread of values for key parameters.", styles['Italic']))
            story.append(Spacer(1, 24))

            # 4. Summary Statistics Table
            story.append(Paragraph("4. Detailed Summary Statistics", styles['Heading2']))
            stats = dataset.summary.get('stats', {})
            target_params = ['Flowrate', 'Pressure', 'Temperature']
            
            table_data = [['Parameter', 'Count', 'Min', 'Max', 'Mean', 'Std', '50% (Median)']]
            
            # stats is { 'count': {param: val}, 'mean': {param: val}, ... }
            # We need to iterate over parameters.
            if 'count' in stats:
                params = list(stats['count'].keys())
                for param in params:
                    # Check if this parameter is one we want to show (or show all numeric)
                    # For now, let's show all numeric params that match our targets or just all of them?
                    # User mentioned "Flowrate, Pressure, Temperature".
                    if any(tp.lower() in param.lower() for tp in target_params) or param in target_params:
                        row = [
                            param,
                            f"{stats.get('count', {}).get(param, 0):.0f}",
                            f"{stats.get('min', {}).get(param, 0):.2f}",
                            f"{stats.get('max', {}).get(param, 0):.2f}",
                            f"{stats.get('mean', {}).get(param, 0):.2f}",
                            f"{stats.get('std', {}).get(param, 0):.2f}",
                            f"{stats.get('50%', {}).get(param, 0):.2f}"
                        ]
                        table_data.append(row)
            
            if len(table_data) > 1:
                t = Table(table_data)
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ]))
                story.append(t)
                story.append(Paragraph("Table 1: Numeric summaries for key parameters.", styles['Italic']))
            story.append(Spacer(1, 24))

            # 5. Data Preview
            story.append(Paragraph("5. Data Preview (First 15 Rows)", styles['Heading2']))
            preview = dataset.summary.get('preview', [])
            if preview:
                # Limit to first 15 rows and first 5 columns to fit on page
                preview_rows = preview[:15]
                columns = dataset.summary.get('columns', [])[:5] 
                
                preview_table_data = [columns]
                for row in preview_rows:
                    preview_table_data.append([str(row.get(col, '')) for col in columns])
                
                t2 = Table(preview_table_data)
                t2.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                    ('FONTSIZE', (0, 0), (-1, -1), 8),
                ]))
                story.append(t2)
            
            doc.build(story)
            return response
        except DataSet.DoesNotExist:
            return Response({'error': 'File not found or access denied'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            with open('pdf_debug.log', 'a') as f:
                f.write(f"PDF Generation Error: {str(e)}\n")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

