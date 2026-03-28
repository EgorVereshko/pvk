from django.contrib import admin
from .models import *

admin.site.register(UserProfile)
admin.site.register(UserRole)
admin.site.register(Team)
admin.site.register(TeamMember)
admin.site.register(Quality)
admin.site.register(Indicator)
admin.site.register(IndicatorQuestion)
admin.site.register(Template)
admin.site.register(AssessmentModel)
admin.site.register(AssessmentForm)
admin.site.register(IndicatorTemplate)
admin.site.register(QualityIndicatorRatio)
admin.site.register(QualitiesScoreRegister)
admin.site.register(Scores360Register)
admin.site.register(IndicatorScoresRegister)
admin.site.register(AverageIndicatorScoresRegister)
