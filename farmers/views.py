from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login
from django.contrib import messages
from django.db import transaction
from django.core.exceptions import PermissionDenied
from django.http import JsonResponse
from django.conf import settings
from django.urls import reverse
from .forms import CustomUserCreationForm, FarmerProfileForm, ProductForm, OrderForm
from .models import FarmerProfile, Product, Order
import stripe

stripe.api_key = settings.STRIPE_SECRET_KEY

def register(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            try:
                with transaction.atomic():
                    user = form.save()
                    login(request, user)
                    messages.success(request, 'Registration successful! Please complete your profile.')
                    return redirect('profile_setup')
            except Exception as e:
                messages.error(request, 'An error occurred during registration. Please try again.')
    else:
        form = CustomUserCreationForm()
    return render(request, 'farmers/register.html', {'form': form})

@login_required
def profile_setup(request):
    try:
        profile = FarmerProfile.objects.get(user=request.user)
        messages.info(request, 'You have already set up your profile.')
        return redirect('dashboard')
    except FarmerProfile.DoesNotExist:
        if request.method == 'POST':
            form = FarmerProfileForm(request.POST)
            if form.is_valid():
                try:
                    with transaction.atomic():
                        profile = form.save(commit=False)
                        profile.user = request.user
                        profile.save()
                        messages.success(request, 'Profile setup completed successfully!')
                        return redirect('dashboard')
                except Exception as e:
                    messages.error(request, 'An error occurred while saving your profile. Please try again.')
        else:
            form = FarmerProfileForm()
        return render(request, 'farmers/profile_setup.html', {'form': form})

@login_required
def dashboard(request):
    try:
        profile = request.user.farmerprofile
        products = Product.objects.filter(farmer=profile)
        orders = Order.objects.filter(product__farmer=profile)
        context = {
            'profile': profile,
            'products': products,
            'orders': orders
        }
        return render(request, 'farmers/dashboard.html', context)
    except FarmerProfile.DoesNotExist:
        messages.warning(request, 'Please complete your profile setup first.')
        return redirect('profile_setup')
    except Exception as e:
        messages.error(request, 'An error occurred while loading the dashboard.')
        return redirect('home')

@login_required
def product_list(request):
    try:
        products = Product.objects.select_related('farmer').all()
        return render(request, 'farmers/product_list.html', {'products': products})
    except Exception as e:
        messages.error(request, 'An error occurred while loading products.')
        return redirect('dashboard')

@login_required
def add_product(request):
    try:
        profile = request.user.farmerprofile
    except FarmerProfile.DoesNotExist:
        messages.warning(request, 'Please complete your profile setup first.')
        return redirect('profile_setup')

    if request.method == 'POST':
        form = ProductForm(request.POST)
        if form.is_valid():
            try:
                with transaction.atomic():
                    product = form.save(commit=False)
                    product.farmer = profile
                    product.save()
                    messages.success(request, 'Product added successfully!')
                    return redirect('dashboard')
            except Exception as e:
                messages.error(request, 'An error occurred while adding the product. Please try again.')
    else:
        form = ProductForm()
    return render(request, 'farmers/add_product.html', {'form': form})

@login_required
def place_order(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    
    if request.method == 'POST':
        form = OrderForm(request.POST, product=product)
        if form.is_valid():
            try:
                with transaction.atomic():
                    quantity = form.cleaned_data['quantity']
                    total_price = product.price * quantity
                    
                    # Check if there's enough stock
                    if quantity > product.quantity:
                        messages.error(request, 'Not enough stock available.')
                        return JsonResponse({
                            'success': False,
                            'error': 'Not enough stock available.'
                        })
                    
                    # Create Stripe payment intent
                    try:
                        intent = stripe.PaymentIntent.create(
                            amount=int(total_price * 100),  # Convert to cents
                            currency='usd',
                            metadata={
                                'product_id': product.id,
                                'quantity': quantity,
                                'buyer_id': request.user.id
                            }
                        )
                        
                        # Create order
                        order = Order.objects.create(
                            buyer=request.user,
                            product=product,
                            quantity=quantity,
                            total_price=total_price,
                            stripe_payment_intent=intent.id
                        )
                        
                        # Update product quantity
                        product.quantity -= quantity
                        product.save()
                        
                        return JsonResponse({
                            'success': True,
                            'client_secret': intent.client_secret,
                            'redirect_url': reverse('orders')
                        })
                        
                    except stripe.error.StripeError as e:
                        return JsonResponse({
                            'success': False,
                            'error': str(e)
                        })
                        
            except Exception as e:
                messages.error(request, 'An error occurred while placing the order. Please try again.')
                return JsonResponse({
                    'success': False,
                    'error': 'An error occurred while placing the order.'
                })
    else:
        form = OrderForm(product=product)
    
    context = {
        'form': form,
        'product': product,
        'stripe_public_key': settings.STRIPE_PUBLIC_KEY
    }
    return render(request, 'farmers/place_order.html', context)

@login_required
def payment_webhook(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        return JsonResponse({'error': 'Invalid payload'}, status=400)
    except stripe.error.SignatureVerificationError as e:
        return JsonResponse({'error': 'Invalid signature'}, status=400)

    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        
        try:
            order = Order.objects.get(stripe_payment_intent=payment_intent['id'])
            order.status = 'completed'
            order.save()
            
            messages.success(request, 'Payment successful!')
        except Order.DoesNotExist:
            return JsonResponse({'error': 'Order not found'}, status=404)
        
    return JsonResponse({'success': True})

@login_required
def orders(request):
    try:
        user_orders = Order.objects.select_related('product', 'product__farmer').filter(buyer=request.user)
        return render(request, 'farmers/orders.html', {'orders': user_orders})
    except Exception as e:
        messages.error(request, 'An error occurred while loading orders.')
        return redirect('dashboard')