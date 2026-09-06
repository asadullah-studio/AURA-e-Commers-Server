import prisma from '../lib/prisma.js';

export async function getProducts(req, res, next) {
  try {
    const {
      category,
      subCategory,
      search,
      sort,
      trending,
      newArrival,
      limit,
    } = req.query;

    const where = {};

    if (category) {
      where.category = {
        slug: category.toLowerCase(),
      };
    }

    if (subCategory) {
      where.subCategory = {
        equals: subCategory,
        mode: 'insensitive',
      };
    }

    if (trending === 'true') {
      where.isTrending = true;
    }

    if (newArrival === 'true') {
      where.isNewArrival = true;
    }

    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { subCategory: { contains: searchTerm, mode: 'insensitive' } },
        { category: { name: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'price-asc') {
      orderBy = { price: 'asc' };
    } else if (sort === 'price-desc') {
      orderBy = { price: 'desc' };
    } else if (sort === 'rating') {
      orderBy = { rating: 'desc' };
    } else if (sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    const products = await prisma.product.findMany({
      where,
      orderBy,
      take: limit ? parseInt(limit, 10) : undefined,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductById(req, res, next) {
  try {
    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductsByCategory(req, res, next) {
  try {
    const { category } = req.params;
    const { sort, subCategory, limit } = req.query;

    const where = {
      category: {
        slug: category.toLowerCase(),
      },
    };

    if (subCategory) {
      where.subCategory = {
        equals: subCategory,
        mode: 'insensitive',
      };
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'price-asc') {
      orderBy = { price: 'asc' };
    } else if (sort === 'price-desc') {
      orderBy = { price: 'desc' };
    } else if (sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    const products = await prisma.product.findMany({
      where,
      orderBy,
      take: limit ? parseInt(limit, 10) : undefined,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
}
