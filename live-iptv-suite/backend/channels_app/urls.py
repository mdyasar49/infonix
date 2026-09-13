from django.urls import path
from .views import (
    CategoryListView,
    LanguageListView,
    ChannelListView,
    ChannelDetailView,
    MovieListView,
    MovieDetailView,
    MovieStreamResolveView,
    MovieYearsView,
    MovieSyncView,
    MovieStreamShieldView,
    ChannelStreamShieldView,
    StreamTicketShieldView,
    StreamProxyView,
    HealthCheckView,
    JioAirtelAutoConnectorView
)
from .jiotv_auth import JioTvSendOtpView, JioTvVerifyOtpView

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health_check'),
    path('connectors/auto-extract/', JioAirtelAutoConnectorView.as_view(), name='auto_extract_connectors'),
    path('connectors/jiotv/send-otp/', JioTvSendOtpView.as_view(), name='jiotv_send_otp'),
    path('connectors/jiotv/verify-otp/', JioTvVerifyOtpView.as_view(), name='jiotv_verify_otp'),
    path('languages/', LanguageListView.as_view(), name='language_list'),
    path('categories/', CategoryListView.as_view(), name='category_list'),
    path('channels/', ChannelListView.as_view(), name='channel_list'),
    path('channels/<int:pk>/', ChannelDetailView.as_view(), name='channel_detail'),
    path('movies/', MovieListView.as_view(), name='movie_list'),
    path('movies/years/', MovieYearsView.as_view(), name='movie_years'),
    path('movies/sync/', MovieSyncView.as_view(), name='movie_sync'),
    path('movies/<int:pk>/', MovieDetailView.as_view(), name='movie_detail'),
    path('movies/<int:pk>/stream/', MovieStreamResolveView.as_view(), name='movie_stream_resolve'),
    path('stream/movie/<int:pk>/', MovieStreamShieldView.as_view(), name='movie_stream_shield'),
    path('stream/channel/<int:pk>/', ChannelStreamShieldView.as_view(), name='channel_stream_shield'),
    path('stream/ticket/<str:ticket>/', StreamTicketShieldView.as_view(), name='stream_ticket_shield'),
    path('proxy/', StreamProxyView.as_view(), name='stream_proxy'),
]

