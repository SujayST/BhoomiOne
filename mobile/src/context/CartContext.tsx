import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartItem, Product, Coupon } from '../types';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  cartTotal: number;
  discount: number;
  appliedCoupon: Coupon | null;
  isLoading: boolean;
  addToCart: (product: Product, quantity?: number, size?: string) => Promise<boolean>;
  removeFromCart: (productId: string, size?: string) => Promise<boolean>;
  updateQuantity: (productId: string, quantity: number, size?: string) => Promise<boolean>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  applyCoupon: (coupon: Coupon) => { success: boolean; message?: string };
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType>({} as CartContextType);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCartItems([]);
      return;
    }
    try {
      setIsLoading(true);
      const res = await cartService.getCartItems();
      if (res?.cartProducts) {
        setCartItems(res.cartProducts);
      } else {
        setCartItems([]);
      }
    } catch (e) {
      console.error('Error fetching cart:', e);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (product: Product, quantity: number = 1, size: string = 'Standard') => {
    if (!isAuthenticated) return false;
    try {
      setIsLoading(true);
      const storeId = typeof product.pStore === 'object' && product.pStore !== null ? product.pStore._id : (product.pStore as string || '');
      const imageUrl = product.url && product.url.length > 0 ? product.url[0] : '';
      await cartService.addItemToCart({
        productId: product._id,
        productName: product.pName,
        productPrice: product.pPrice,
        productQuantity: quantity,
        productSize: size,
        productStoreId: storeId,
        productPhotoUrl: imageUrl,
      });
      await fetchCart();
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (productId: string, size: string = 'Standard') => {
    if (!isAuthenticated) return false;
    try {
      setIsLoading(true);
      await cartService.removeItemFromCart(productId, size);
      await fetchCart();
      return true;
    } catch (error) {
      console.error('Error removing from cart:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (productId: string, quantity: number, size: string = 'Standard') => {
    if (!isAuthenticated) return false;
    if (quantity <= 0) {
      return removeFromCart(productId, size);
    }
    try {
      setIsLoading(true);
      await cartService.changeQuantity(productId, quantity, size);
      await fetchCart();
      return true;
    } catch (error) {
      console.error('Error changing quantity:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      await cartService.clearCart();
      setCartItems([]);
      setAppliedCoupon(null);
    } catch (error) {
      console.error('Error clearing cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyCoupon = (coupon: Coupon) => {
    const rawTotal = cartItems.reduce(
      (sum, item) => sum + (item.productPrice || 0) * (item.productQuantity || 1),
      0
    );
    if (coupon.minAmount && rawTotal < coupon.minAmount) {
      return {
        success: false,
        message: `Minimum order amount of ₹${coupon.minAmount} required for this coupon`,
      };
    }
    setAppliedCoupon(coupon);
    return { success: true, message: `Applied ${coupon.couponName} successfully!` };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const cartCount = cartItems.reduce((acc, item) => acc + (item.productQuantity || 1), 0);
  
  const rawTotal = cartItems.reduce(
    (sum, item) => sum + (item.productPrice || 0) * (item.productQuantity || 1),
    0
  );

  const discount = appliedCoupon ? Math.min(rawTotal, appliedCoupon.discount) : 0;
  const cartTotal = Math.max(0, rawTotal - discount);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartTotal,
        discount,
        appliedCoupon,
        isLoading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart: fetchCart,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

