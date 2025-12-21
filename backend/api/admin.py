from django.contrib import admin
from .models import *

admin.site.register(UserProfile)
admin.site.register(UserRole)
admin.site.register(Team)
admin.site.register(TeamMember)
admin.site.register(Indicator)
admin.site.register(IndicatorsList)
admin.site.register(IndicatorsListTemplate)
admin.site.register(Competence)
admin.site.register(CompetencesScore)
admin.site.register(QualityCompetenceRatio)
admin.site.register(CompetenceIndicatorRatio)
admin.site.register(QualitiesScore)
admin.site.register(Event)
admin.site.register(CheckList)
