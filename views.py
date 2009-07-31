from django.shortcuts import render_to_response
from django.template import RequestContext

def index(request):
    return render(request, 'index')
    
def render(request, template, params={}, context_instance=None, template_ext='.html', **kwargs):
    return render_to_response(
                str(template) + template_ext,
                params,
                context_instance=(context_instance or RequestContext(request)),
                **kwargs
            )