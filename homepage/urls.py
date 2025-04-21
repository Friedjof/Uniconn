from django.urls import path

from .views import HomePageView, SearchResultsView

app_name = 'homepage'

urlpatterns = [
    path('', HomePageView.as_view(), name='index'),
    path('search/', SearchResultsView.as_view(), name='search_results'),
]
