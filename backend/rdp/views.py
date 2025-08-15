from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Theme, Layer, PetriNet, Place, Transition, Arc
from .serializers import (
    ThemeSerializer, LayerSerializer, PetriNetSerializer,
    PlaceSerializer, TransitionSerializer, ArcSerializer, ThemeDetailSerializer
)


# Theme Views
class ThemeListView(APIView):
    def get(self, request):
        themes = Theme.objects.all()
        serializer = ThemeSerializer(themes, many=True)
        return Response(serializer.data)


class ThemeCreateView(APIView):
    def post(self, request):
        serializer = ThemeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ThemeRetrieveView(APIView):
    def get(self, request, pk):
        try:
            theme = Theme.objects.get(pk=pk)
            serializer = ThemeDetailSerializer(theme)
            return Response(serializer.data)
        except Theme.DoesNotExist:
            return Response({'error': 'Theme not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(e)
            return Response({'erreur':str(e)}, status=500)


class ThemeUpdateView(APIView):
    def put(self, request, pk):
        try:
            theme = Theme.objects.get(pk=pk)
            serializer = ThemeSerializer(theme, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Theme.DoesNotExist:
            return Response({'error': 'Theme not found'}, status=status.HTTP_404_NOT_FOUND)


class ThemeDeleteView(APIView):
    def delete(self, request, pk):
        try:
            theme = Theme.objects.get(pk=pk)
            theme.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Theme.DoesNotExist:
            return Response({'error': 'Theme not found'}, status=status.HTTP_404_NOT_FOUND)


# Layer Views
class LayerListView(APIView):
    def get(self, request):
        layers = Layer.objects.all()
        serializer = LayerSerializer(layers, many=True)
        return Response(serializer.data)


class LayerCreateView(APIView):
    def post(self, request):
        serializer = LayerSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LayerRetrieveView(APIView):
    def get(self, request, pk):
        try:
            layer = Layer.objects.get(pk=pk)
            serializer = LayerSerializer(layer)
            return Response(serializer.data)
        except Layer.DoesNotExist:
            return Response({'error': 'Layer not found'}, status=status.HTTP_404_NOT_FOUND)


class LayerUpdateView(APIView):
    def put(self, request, pk):
        try:
            layer = Layer.objects.get(pk=pk)
            serializer = LayerSerializer(layer, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Layer.DoesNotExist:
            return Response({'error': 'Layer not found'}, status=status.HTTP_404_NOT_FOUND)


class LayerDeleteView(APIView):
    def delete(self, request, pk):
        try:
            layer = Layer.objects.get(pk=pk)
            layer.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Layer.DoesNotExist:
            return Response({'error': 'Layer not found'}, status=status.HTTP_404_NOT_FOUND)


# PetriNet Views
class PetriNetListView(APIView):
    def get(self, request):
        petri_nets = PetriNet.objects.all()
        serializer = PetriNetSerializer(petri_nets, many=True)
        return Response(serializer.data)


class PetriNetCreateView(APIView):
    def post(self, request):
        serializer = PetriNetSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PetriNetRetrieveView(APIView):
    def get(self, request, pk):
        try:
            petri_net = PetriNet.objects.get(pk=pk)
            serializer = PetriNetSerializer(petri_net)
            return Response(serializer.data)
        except PetriNet.DoesNotExist:
            return Response({'error': 'PetriNet not found'}, status=status.HTTP_404_NOT_FOUND)


class PetriNetUpdateView(APIView):
    def put(self, request, pk):
        try:
            petri_net = PetriNet.objects.get(pk=pk)
            serializer = PetriNetSerializer(petri_net, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except PetriNet.DoesNotExist:
            return Response({'error': 'PetriNet not found'}, status=status.HTTP_404_NOT_FOUND)


class PetriNetDeleteView(APIView):
    def delete(self, request, pk):
        try:
            petri_net = PetriNet.objects.get(pk=pk)
            petri_net.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except PetriNet.DoesNotExist:
            return Response({'error': 'PetriNet not found'}, status=status.HTTP_404_NOT_FOUND)


# Place Views
class PlaceListView(APIView):
    def get(self, request):
        places = Place.objects.all()
        serializer = PlaceSerializer(places, many=True)
        return Response(serializer.data)


class PlaceCreateView(APIView):
    def post(self, request):
        serializer = PlaceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PlaceRetrieveView(APIView):
    def get(self, request, pk):
        try:
            place = Place.objects.get(pk=pk)
            serializer = PlaceSerializer(place)
            return Response(serializer.data)
        except Place.DoesNotExist:
            return Response({'error': 'Place not found'}, status=status.HTTP_404_NOT_FOUND)


class PlaceUpdateView(APIView):
    def put(self, request, pk):
        try:
            place = Place.objects.get(pk=pk)
            serializer = PlaceSerializer(place, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Place.DoesNotExist:
            return Response({'error': 'Place not found'}, status=status.HTTP_404_NOT_FOUND)


class PlaceDeleteView(APIView):
    def delete(self, request, pk):
        try:
            place = Place.objects.get(pk=pk)
            place.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Place.DoesNotExist:
            return Response({'error': 'Place not found'}, status=status.HTTP_404_NOT_FOUND)


# Transition Views
class TransitionListView(APIView):
    def get(self, request):
        transitions = Transition.objects.all()
        serializer = TransitionSerializer(transitions, many=True)
        return Response(serializer.data)


class TransitionCreateView(APIView):
    def post(self, request):
        serializer = TransitionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TransitionRetrieveView(APIView):
    def get(self, request, pk):
        try:
            transition = Transition.objects.get(pk=pk)
            serializer = TransitionSerializer(transition)
            return Response(serializer.data)
        except Transition.DoesNotExist:
            return Response({'error': 'Transition not found'}, status=status.HTTP_404_NOT_FOUND)


class TransitionUpdateView(APIView):
    def put(self, request, pk):
        try:
            transition = Transition.objects.get(pk=pk)
            serializer = TransitionSerializer(transition, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Transition.DoesNotExist:
            return Response({'error': 'Transition not found'}, status=status.HTTP_404_NOT_FOUND)


class TransitionDeleteView(APIView):
    def delete(self, request, pk):
        try:
            transition = Transition.objects.get(pk=pk)
            transition.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Transition.DoesNotExist:
            return Response({'error': 'Transition not found'}, status=status.HTTP_404_NOT_FOUND)


# Arc Views
class ArcListView(APIView):
    def get(self, request):
        arcs = Arc.objects.all()
        serializer = ArcSerializer(arcs, many=True)
        return Response(serializer.data)


class ArcCreateView(APIView):
    def post(self, request):
        serializer = ArcSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ArcRetrieveView(APIView):
    def get(self, request, pk):
        try:
            arc = Arc.objects.get(pk=pk)
            serializer = ArcSerializer(arc)
            return Response(serializer.data)
        except Arc.DoesNotExist:
            return Response({'error': 'Arc not found'}, status=status.HTTP_404_NOT_FOUND)


class ArcUpdateView(APIView):
    def put(self, request, pk):
        try:
            arc = Arc.objects.get(pk=pk)
            serializer = ArcSerializer(arc, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Arc.DoesNotExist:
            return Response({'error': 'Arc not found'}, status=status.HTTP_404_NOT_FOUND)


class ArcDeleteView(APIView):
    def delete(self, request, pk):
        try:
            arc = Arc.objects.get(pk=pk)
            arc.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Arc.DoesNotExist:
            return Response({'error': 'Arc not found'}, status=status.HTTP_404_NOT_FOUND)