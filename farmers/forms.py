from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from .models import FarmerProfile, Product, Order

class CustomUserCreationForm(UserCreationForm):
    email = forms.EmailField(required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password1', 'password2')

class FarmerProfileForm(forms.ModelForm):
    phone_number = forms.CharField(max_length=15, help_text='Enter a valid phone number')
    farm_size = forms.DecimalField(max_digits=10, decimal_places=2, help_text='Enter farm size in acres')

    class Meta:
        model = FarmerProfile
        fields = ('phone_number', 'location', 'farm_size')

    def clean_phone_number(self):
        phone_number = self.cleaned_data.get('phone_number')
        if not phone_number.isdigit():
            raise forms.ValidationError('Phone number must contain only digits')
        return phone_number

class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = ('name', 'description', 'price', 'quantity', 'category')

    def clean_price(self):
        price = self.cleaned_data.get('price')
        if price <= 0:
            raise forms.ValidationError('Price must be greater than zero')
        return price

    def clean_quantity(self):
        quantity = self.cleaned_data.get('quantity')
        if quantity < 0:
            raise forms.ValidationError('Quantity cannot be negative')
        return quantity

class OrderForm(forms.ModelForm):
    class Meta:
        model = Order
        fields = ('quantity',)

    def __init__(self, *args, product=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.product = product

    def clean_quantity(self):
        quantity = self.cleaned_data.get('quantity')
        if quantity <= 0:
            raise forms.ValidationError('Quantity must be greater than zero')
        if self.product and quantity > self.product.quantity:
            raise forms.ValidationError('Requested quantity exceeds available stock')
        return quantity 