from django.conf import settings

def stripe_public_key(request):
    return {
        'STRIPE_PUBLIC_KEY': settings.STRIPE_PUBLIC_KEY
    } 