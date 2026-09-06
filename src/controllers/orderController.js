import prisma from '../lib/prisma.js';

export async function createOrder(req, res, next) {
  try {
    const userId = req.user.id;
    const {
      customerName,
      phone,
      email,
      address,
      city,
      area,
    } = req.body;

    // Validate required delivery details
    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Valid phone number is required.' });
    }
    if (!address || !address.trim()) {
      return res.status(400).json({ success: false, message: 'Delivery address is required.' });
    }
    if (!city || !city.trim()) {
      return res.status(400).json({ success: false, message: 'City is required.' });
    }
    if (!area || !area.trim()) {
      return res.status(400).json({ success: false, message: 'Area/Thana is required.' });
    }

    // Retrieve user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty. Please add items before placing an order.',
      });
    }

    // Recalculate total server-side
    let calculatedTotal = 0;
    const orderItemsData = [];

    for (const item of cart.items) {
      const activePrice = item.product.discountPrice || item.product.price;
      const lineTotal = activePrice * item.quantity;
      calculatedTotal += lineTotal;

      orderItemsData.push({
        productId: item.productId,
        productName: item.product.name,
        price: activePrice,
        quantity: item.quantity,
        size: item.size,
      });
    }

    // Generate unique order number (e.g., ORD-10025)
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `ORD-${randomSuffix}`;

    // Execute in a transaction: create order + create items + clear cart
    const newOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          totalAmount: calculatedTotal,
          status: 'PENDING',
          paymentMethod: 'CASH_ON_DELIVERY',
          customerName: customerName.trim(),
          phone: phone.trim(),
          email: (email || req.user.email || '').trim(),
          address: address.trim(),
          city: city.trim(),
          area: area.trim(),
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  slug: true,
                },
              },
            },
          },
        },
      });

      // Clear user's cart items
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return order;
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! Thank you for your order.',
      data: newOrder,
    });
  } catch (error) {
    next(error);
  }
}

export async function getOrders(req, res, next) {
  try {
    const userId = req.user.id;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
}

export async function getOrderById(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        userId,
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or unauthorized.',
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
}
