import prisma from '../lib/prisma.js';

// Helper to get or create cart for user
async function getOrCreateCart(userId) {
  let cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
    });
  }

  return cart;
}

export async function getCart(req, res, next) {
  try {
    const userId = req.user.id;
    const cart = await getOrCreateCart(userId);

    const cartItems = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            discountPrice: true,
            image: true,
            stock: true,
            category: {
              select: { name: true, slug: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute subtotal and total items
    let subtotal = 0;
    let totalQuantity = 0;

    const formattedItems = cartItems.map((item) => {
      const activePrice = item.product.discountPrice || item.product.price;
      const itemTotal = activePrice * item.quantity;
      subtotal += itemTotal;
      totalQuantity += item.quantity;

      return {
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        size: item.size,
        createdAt: item.createdAt,
        product: item.product,
        activePrice,
        itemTotal,
      };
    });

    res.json({
      success: true,
      data: {
        id: cart.id,
        items: formattedItems,
        subtotal,
        totalQuantity,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function addToCart(req, res, next) {
  try {
    const userId = req.user.id;
    const { productId, size, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required.',
      });
    }

    if (!size || !size.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please select a size before adding to cart.',
      });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    const cart = await getOrCreateCart(userId);
    const parsedQty = Math.max(1, parseInt(quantity, 10) || 1);

    // Check if item with exact same product and size exists
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId_size: {
          cartId: cart.id,
          productId,
          size: size.trim(),
        },
      },
    });

    let resultItem;
    if (existingItem) {
      resultItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + parsedQty,
        },
        include: { product: true },
      });
    } else {
      resultItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          size: size.trim(),
          quantity: parsedQty,
        },
        include: { product: true },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully.',
      data: resultItem,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCartItem(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { quantity } = req.body;

    const cart = await getOrCreateCart(userId);

    const item = await prisma.cartItem.findFirst({
      where: {
        id,
        cartId: cart.id,
      },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found.',
      });
    }

    const parsedQty = parseInt(quantity, 10);

    if (parsedQty <= 0) {
      await prisma.cartItem.delete({
        where: { id },
      });
      return res.json({
        success: true,
        message: 'Item removed from cart.',
      });
    }

    const updated = await prisma.cartItem.update({
      where: { id },
      data: { quantity: parsedQty },
      include: { product: true },
    });

    res.json({
      success: true,
      message: 'Cart updated.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function removeCartItem(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const cart = await getOrCreateCart(userId);

    const item = await prisma.cartItem.findFirst({
      where: {
        id,
        cartId: cart.id,
      },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found.',
      });
    }

    await prisma.cartItem.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Item removed from cart.',
    });
  } catch (error) {
    next(error);
  }
}

export async function clearCart(req, res, next) {
  try {
    const userId = req.user.id;
    const cart = await getOrCreateCart(userId);

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    res.json({
      success: true,
      message: 'Cart cleared successfully.',
    });
  } catch (error) {
    next(error);
  }
}
