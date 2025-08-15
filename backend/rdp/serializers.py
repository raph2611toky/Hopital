from rest_framework import serializers
from rdp.models import Theme, Layer, PetriNet, Place, Transition, Arc


class ThemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Theme
        fields = ['id', 'name', 'description', 'created_at']


class LayerSerializer(serializers.ModelSerializer):
    theme = serializers.PrimaryKeyRelatedField(queryset=Theme.objects.all())

    class Meta:
        model = Layer
        fields = ['id', 'name', 'theme', 'created_at']


class PetriNetSerializer(serializers.ModelSerializer):
    theme = serializers.PrimaryKeyRelatedField(queryset=Theme.objects.all())
    layer = serializers.PrimaryKeyRelatedField(queryset=Layer.objects.all())

    class Meta:
        model = PetriNet
        fields = ['id', 'name', 'theme', 'layer', 'created_at']


class PlaceSerializer(serializers.ModelSerializer):
    petri_net = serializers.PrimaryKeyRelatedField(queryset=PetriNet.objects.all())

    class Meta:
        model = Place
        fields = ['id', 'petri_net', 'id_in_net', 'label', 'position', 'tokens', 'capacity', 'token_color', 'created_at']


class TransitionSerializer(serializers.ModelSerializer):
    petri_net = serializers.PrimaryKeyRelatedField(queryset=PetriNet.objects.all())

    class Meta:
        model = Transition
        fields = [
            'id', 'petri_net', 'id_in_net', 'label', 'position', 'type', 'delay_mean',
            'priority', 'orientation', 'created_at'
        ]


class ArcSerializer(serializers.ModelSerializer):
    petri_net = serializers.PrimaryKeyRelatedField(queryset=PetriNet.objects.all())

    class Meta:
        model = Arc
        fields = [
            'id', 'petri_net', 'id_in_net', 'source_id', 'target_id', 'weight',
            'is_inhibitor', 'is_reset', 'created_at'
        ]