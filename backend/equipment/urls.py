
from django.urls import path
from .views import UploadView, HistoryView, ApiRootView, DeleteDataSetView, GeneratePDFView, RegisterView, DeleteAccountView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('', ApiRootView.as_view(), name='api-root'),
    path('upload/', UploadView.as_view(), name='upload'),
    path('history/', HistoryView.as_view(), name='history'),
    path('history/<int:pk>/', DeleteDataSetView.as_view(), name='delete_dataset'),
    path('history/<int:pk>/pdf/', GeneratePDFView.as_view(), name='generate_pdf'),
    path('delete-account/', DeleteAccountView.as_view(), name='delete_account'),
    path('register/', RegisterView.as_view(), name='register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
