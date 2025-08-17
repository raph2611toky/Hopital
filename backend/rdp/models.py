from django.db import models
from django.core.validators import MinValueValidator


class Theme(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class Layer(models.Model):
    name = models.CharField(max_length=100)
    theme = models.ForeignKey(Theme, on_delete=models.CASCADE, related_name='layers')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.theme.name})"

    class Meta:
        unique_together = ['name', 'theme']
        ordering = ['name']


class PetriNet(models.Model):
    name = models.CharField(max_length=100)
    theme = models.ForeignKey(Theme, on_delete=models.CASCADE, related_name='petri_nets')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.theme.name} - {self.layer.name})"

    class Meta:
        unique_together = ['name', 'theme']
        ordering = ['name']


class Place(models.Model):
    petri_net = models.ForeignKey(PetriNet, on_delete=models.CASCADE, related_name='places')
    id_in_net = models.CharField(max_length=50)  # ex: p123
    label = models.CharField(max_length=100)
    position = models.JSONField()  # {x: float, y: float}
    tokens = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    capacity = models.IntegerField(null=True, blank=True)
    token_color = models.CharField(max_length=7, default="#000000")  # ex: #000000
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.label} ({self.petri_net.name})"

    class Meta:
        unique_together = ['petri_net', 'id_in_net']
        ordering = ['id_in_net']


class Transition(models.Model):
    petri_net = models.ForeignKey(PetriNet, on_delete=models.CASCADE, related_name='transitions')
    id_in_net = models.CharField(max_length=50)  # ex: t123
    label = models.CharField(max_length=100)
    position = models.JSONField()  # {x: float, y: float}
    type = models.CharField(
        max_length=20,
        choices=[('immediate', 'Immediate'), ('timed', 'Timed')],
        default='immediate'
    )
    delay_mean = models.FloatField(default=1.0, validators=[MinValueValidator(0.0)])
    priority = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    orientation = models.CharField(
        max_length=20,
        choices=[('portrait', 'Portrait'), ('landscape', 'Landscape')],
        default='portrait'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.label} ({self.petri_net.name})"

    class Meta:
        unique_together = ['petri_net', 'id_in_net']
        ordering = ['id_in_net']


class Arc(models.Model):
    petri_net = models.ForeignKey(PetriNet, on_delete=models.CASCADE, related_name='arcs')
    id_in_net = models.CharField(max_length=50)
    source_id = models.CharField(max_length=50)
    target_id = models.CharField(max_length=50)
    control_points = models.JSONField(null=True, blank=True)
    weight = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    is_inhibitor = models.BooleanField(default=False)
    is_reset = models.BooleanField(default=False)
    source_direction = models.CharField(
        max_length=10,
        choices=[('HAUT', 'Haut'), ('GAUCHE', 'Gauche'), ('DROITE', 'Droite'), ('BAS', 'Bas')],
        default='BAS'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Arc {self.id_in_net} ({self.petri_net.name})"

    class Meta:
        unique_together = ['petri_net', 'id_in_net']
        ordering = ['id_in_net']