export interface User {
  _id: string;
  fullname: string;
  email: string;
  mobile?: string;
  userRole: number; // 0: customer, 1: store admin, 2: super admin
  userImage?: string;
  savedAddress?: SavedAddress[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SavedAddress {
  _id?: string;
  receiverName: string;
  receiverContactNumber: string;
  receiverAddress: string;
  receiverCity: string;
  receiverDistrict: string;
  receiverState: string;
  receiverPincode: string | number;
}

export interface Category {
  _id: string;
  cName: string;
  cDescription?: string;
  cImage?: string;
  url?: string;
  cStatus?: string;
  cSection?: {
    _id: string;
    secName: string;
  };
  cStore?: {
    _id: string;
    sName: string;
  };
}

export interface Section {
  _id: string;
  secName: string;
  secDescription?: string;
  secStatus?: string;
}

export interface Store {
  _id: string;
  sName: string;
  sDescription?: string;
  sImage?: string;
  sLogo?: string;
  url?: string;
  sStatus?: string;
  sAddress?: string;
  sPincode?: number;
  GST?: string;
  commisionRate?: number;
}

export interface RatingReview {
  _id?: string;
  review: string;
  rating: string | number;
  user?: {
    _id: string;
    fullname?: string;
    name?: string;
    email?: string;
    userImage?: string;
  };
  createdAt?: string;
}

export interface Product {
  _id: string;
  pName: string;
  pDescription: string;
  pPrice: number;
  pSold?: number;
  pQuantity?: string;
  pCategory?: {
    _id: string;
    cName: string;
  } | string;
  pSection?: {
    _id: string;
    secName: string;
  } | string;
  pStore?: {
    _id: string;
    sName: string;
  } | string;
  pImages: string[];
  url?: string[];
  pOffer?: string | null;
  similarProducts?: string;
  pRatingsReviews?: RatingReview[];
  pStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  productId: {
    _id: string;
    pName?: string;
    pImages?: string[];
    pStore?: string;
  } | string;
  productName: string;
  productPrice: number;
  productQuantity: number;
  productSize?: string;
  productStoreId?: string;
  storeName?: string;
  url?: string;
}

export interface CartResponse {
  _id?: string;
  userId: string;
  cartProducts: CartItem[];
  wishlistProducts?: { productId: string }[];
}

export interface OrderProduct {
  id: Product | {
    _id: string;
    pName: string;
    pImages?: string[];
    pPrice: number;
    url?: string;
  };
  quantitiy: number;
  subtotal: number;
  size?: string;
}

export interface Order {
  _id: string;
  allProduct: OrderProduct[];
  user: {
    _id: string;
    fullname?: string;
    name?: string;
    email?: string;
  };
  store?: {
    _id: string;
    sName: string;
  };
  amount: number;
  transactionDetails: any[];
  shippingDetails?: {
    waybill?: string;
    upload_wbn?: string;
    ref_num?: string;
  };
  address: string;
  phone: number;
  invoiceKey?: string;
  invoiceUrl?: string;
  status: 'Not processed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned' | 'Return Requested';
  createdAt?: string;
  updatedAt?: string;
}

export interface SliderImage {
  _id: string;
  slideImage: string;
  url?: string;
  device?: string;
  cStore?: string;
}

export interface Coupon {
  _id: string;
  couponName: string;
  discount: number;
  expiryDate: string;
  minAmount?: number;
  status?: string;
}

