try:
    from django.conf.urls import *
except ImportError:  # django < 1.4
    from django.conf.urls.defaults import *

from . import views


# place app url patterns here
urlpatterns = [
    # URL pattern for the UserListView
    url(
        regex=r'^$',
        view=views.index,
        name='index'
    ),
]