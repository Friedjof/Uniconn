import datetime
from homepage import __version__

def current_year(request):
    return {
        'current_year': datetime.datetime.now().year
    }

def version(request):
    return {
        'version': __version__
    }
