from rest_framework import serializers
from rdp.models import Theme, Layer, PetriNet, Place, Transition, Arc

class ArcSerializer(serializers.ModelSerializer):
    class Meta:
        model = Arc
        fields = [
            'id', 'petri_net', 'id_in_net', 'source_id', 'target_id', 'weight',
            'is_inhibitor', 'is_reset', 'created_at'
        ]

class PlaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Place
        fields = ['id', 'petri_net', 'id_in_net', 'label', 'position', 'tokens', 'capacity', 'token_color', 'created_at']

class TransitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transition
        fields = [
            'id', 'petri_net', 'id_in_net', 'label', 'position', 'type', 'delay_mean',
            'priority', 'orientation', 'created_at'
        ]

class PetriNetSerializer(serializers.ModelSerializer):
    places = PlaceSerializer(many=True, read_only=True)
    transitions = TransitionSerializer(many=True, read_only=True)
    arcs = ArcSerializer(many=True, read_only=True)

    class Meta:
        model = PetriNet
        fields = ['id', 'name', 'theme', 'created_at', 'places', 'transitions', 'arcs']

class LayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Layer
        fields = ['id', 'name', 'theme', 'created_at']

class ThemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Theme
        fields = ['id', 'name', 'description', 'created_at']

class ThemeDetailSerializer(serializers.ModelSerializer):
    layers = LayerSerializer(many=True, read_only=True)
    petri_nets = PetriNetSerializer(many=True, read_only=True)

    class Meta:
        model = Theme
        fields = ['id', 'name', 'description', 'created_at', 'layers', 'petri_nets']