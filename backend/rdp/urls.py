from django.urls import path
from .views import (
    ThemeListView, ThemeCreateView, ThemeRetrieveView, ThemeUpdateView, ThemeDeleteView,
    LayerListView, LayerCreateView, LayerRetrieveView, LayerUpdateView, LayerDeleteView,
    PetriNetListView, PetriNetCreateView, PetriNetRetrieveView, PetriNetUpdateView, PetriNetDeleteView,
    PlaceListView, PlaceCreateView, PlaceRetrieveView, PlaceUpdateView, PlaceDeleteView,
    TransitionListView, TransitionCreateView, TransitionRetrieveView, TransitionUpdateView, TransitionDeleteView,
    ArcListView, ArcCreateView, ArcRetrieveView, ArcUpdateView, ArcDeleteView
)

urlpatterns = [
    # Theme URLs
    path('themes/', ThemeListView.as_view(), name='theme-list'),
    path('themes/create/', ThemeCreateView.as_view(), name='theme-create'),
    path('themes/<int:pk>/', ThemeRetrieveView.as_view(), name='theme-retrieve'),
    path('themes/<int:pk>/update/', ThemeUpdateView.as_view(), name='theme-update'),
    path('themes/<int:pk>/delete/', ThemeDeleteView.as_view(), name='theme-delete'),

    # Layer URLs
    path('layers/', LayerListView.as_view(), name='layer-list'),
    path('layers/create/', LayerCreateView.as_view(), name='layer-create'),
    path('layers/<int:pk>/', LayerRetrieveView.as_view(), name='layer-retrieve'),
    path('layers/<int:pk>/update/', LayerUpdateView.as_view(), name='layer-update'),
    path('layers/<int:pk>/delete/', LayerDeleteView.as_view(), name='layer-delete'),

    # PetriNet URLs
    path('petri-nets/', PetriNetListView.as_view(), name='petri-net-list'),
    path('petri-nets/create/', PetriNetCreateView.as_view(), name='petri-net-create'),
    path('petri-nets/<int:pk>/', PetriNetRetrieveView.as_view(), name='petri-net-retrieve'),
    path('petri-nets/<int:pk>/update/', PetriNetUpdateView.as_view(), name='petri-net-update'),
    path('petri-nets/<int:pk>/delete/', PetriNetDeleteView.as_view(), name='petri-net-delete'),

    # Place URLs
    path('places/', PlaceListView.as_view(), name='place-list'),
    path('places/create/', PlaceCreateView.as_view(), name='place-create'),
    path('places/<int:pk>/', PlaceRetrieveView.as_view(), name='place-retrieve'),
    path('places/<int:pk>/update/', PlaceUpdateView.as_view(), name='place-update'),
    path('places/<int:pk>/delete/', PlaceDeleteView.as_view(), name='place-delete'),

    # Transition URLs
    path('transitions/', TransitionListView.as_view(), name='transition-list'),
    path('transitions/create/', TransitionCreateView.as_view(), name='transition-create'),
    path('transitions/<int:pk>/', TransitionRetrieveView.as_view(), name='transition-retrieve'),
    path('transitions/<int:pk>/update/', TransitionUpdateView.as_view(), name='transition-update'),
    path('transitions/<int:pk>/delete/', TransitionDeleteView.as_view(), name='transition-delete'),

    # Arc URLs
    path('arcs/', ArcListView.as_view(), name='arc-list'),
    path('arcs/create/', ArcCreateView.as_view(), name='arc-create'),
    path('arcs/<int:pk>/', ArcRetrieveView.as_view(), name='arc-retrieve'),
    path('arcs/<int:pk>/update/', ArcUpdateView.as_view(), name='arc-update'),
    path('arcs/<int:pk>/delete/', ArcDeleteView.as_view(), name='arc-delete'),
]