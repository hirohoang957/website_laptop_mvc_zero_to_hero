import { getProductById } from "services/admin/admin.product.service";
import { prisma } from "config/client";
import { string } from "zod";

// Lấy tất cả sản phẩm
const getProducts = async () => {
    const products = await prisma.product.findMany({
        where: {
            AND: {
                quantity: { gt: 0 },
                status: 1
            }
        },
    })
    return products
}

// Lấy tất cả sản phẩm nổi bật
const getHotProducts = async (limit: number = 8) => {
    const products = await prisma.product.findMany({
        where: {
            AND: {
                quantity: { gt: 0 },
                status: 1,
                hot: 1
            }
        },
        orderBy: { createdAt: "desc" },
    })
    return products
}

// Lấy sản phẩm bán chạy
const getBestSellingProducts = async (limit: number = 8) => {
    const products = await prisma.product.findMany({
        where: {
            quantity: { gt: 0 },
            status: 1,
        },
        orderBy: {
            sold: "desc",
        },
        take: limit,
    });
    return products;
};

// Lấy sản phẩm giảm giá nhiều nhất theo %
const getTopDiscountedProducts = async () => {
    const products = await prisma.product.findMany({
        where: {
            quantity: { gt: 0 },
            status: 1,
        },
    });

    return products
        .filter((p) => p.priceOrigin > p.priceCurr && p.priceOrigin > 0)
        .sort((a, b) => {
            const discountA = (a.priceOrigin - a.priceCurr) / a.priceOrigin;
            const discountB = (b.priceOrigin - b.priceCurr) / b.priceOrigin;
            return discountB - discountA;
        })
        .slice(0, 8);
};

// Lấy sản phẩm tương tự
const getRelatedProducts = async (productsId: number[]) => {
    const products = await Promise.all(
        productsId.map((id) => getProductById(String(id)))
    );
    return products;
}

const addProductToCart = async (quantity: number, productId: number, user: Express.User) => {
    const cart = await prisma.cart.findUnique({
        where: { userId: user.id }
    });
    const product = await prisma.product.findUnique({
        where: { id: productId }
    })


    if (cart) {
        // update sum
        await prisma.cart.update({
            where: { id: cart.id },
            data: {
                sum: {
                    increment: quantity
                }
            }
        })

        const curruntCartDetail = await prisma.cartDetail.findFirst({
            where: {
                cartId: cart.id,
                productId: productId
            }
        })

        // upsert = update + insert
        await prisma.cartDetail.upsert({
            where: {
                id: curruntCartDetail?.id ?? 0
            },
            update: {
                quantity: { increment: quantity }
            },
            create: {
                priceCurr: product?.priceCurr ?? 1,
                quantity: quantity,
                productId: productId,
                cartId: cart.id
            }
        })
    } else {
        // create
        await prisma.cart.create({
            data: {
                sum: quantity,
                userId: user.id,
                cartDetails: {
                    create: [
                        {
                            priceCurr: product?.priceCurr ?? 1,
                            quantity: quantity,
                            productId: productId
                        }
                    ]
                }
            }
        });
    }
}

const getCartDetailByUserId = async (id: number) => {
    const cart = await prisma.cart.findUnique({
        where: { userId: id }
    })

    const cartDetails = await prisma.cartDetail.findMany({
        where: { cartId: cart?.id ?? 0 },
        include: { product: true }
    })


    return cartDetails
}

const deleteProductInCart = async (cartDetailId: number, userId: number, sumCart: number) => {
    const cartDetail = await prisma.cartDetail.delete({
        where: { id: cartDetailId }
    })

    if (sumCart - cartDetail.quantity === 0) {
        await prisma.cart.delete({
            where: { userId: userId }
        })
    } else {
        await prisma.cart.update({
            where: { userId },
            data: {
                sum: {
                    decrement: cartDetail.quantity,
                }
            }
        })
    }
}

const updateCartDetailBeforeCheckout = async (data: { id: string; quantity: string }[], userId: number) => {
    let sum = 0;
    data.forEach(async (item) => {
        sum += +item.quantity;
        await prisma.cartDetail.update({
            where: { id: +item.id },
            data: { quantity: +item.quantity }
        })
    })
    await prisma.cart.update({
        where: { userId: userId },
        data: { sum: sum }
    })
}

const handlePlaceOrder = async (userId: number, receiverName: string, receiverAddress: string, receiverPhone: string, totalPrice: string, paymentMethod: string) => {
    try {
        await prisma.$transaction(async (tx) => {
            const cart = await tx.cart.findUnique({
                where: { userId: userId },
                include: { cartDetails: true }
            })

            if (cart) {
                const dataOrderDetail = cart?.cartDetails?.map(
                    item => ({
                        price: item.priceCurr,
                        quantity: item.quantity,
                        productId: item.productId
                    })
                ) ?? [];

                await tx.order.create({
                    data: {
                        receiverName,
                        receiverAddress,
                        receiverPhone,
                        status: "PENDING",
                        totalPrice: +totalPrice,
                        paymentMethod: paymentMethod,
                        paymentStatus: paymentMethod === "BANKING" ? "PAID" : "UNPAID",
                        userId,
                        orderDetails: {
                            create: dataOrderDetail
                        }
                    }
                })

                await tx.cartDetail.deleteMany({
                    where: { cartId: cart.id }
                })

                await tx.cart.delete({
                    where: { id: cart.id }
                })

                for(let i = 0; i < cart.cartDetails.length; i++) {
                    const productId = cart.cartDetails[i].productId;
                    const product = await tx.product.findUnique({
                        where: {id: productId}
                    })
                    if (!product || product.quantity < cart.cartDetails[i].quantity) {
                        throw new Error(`Sản phẩm ${product?.name} không tồn tại hoặc không đủ sô lượng!`);
                    }
                    await tx.product.update({
                        where: { id: productId },
                        data: {
                            sold: { increment: cart.cartDetails[i].quantity },
                            quantity: { decrement: cart.cartDetails[i].quantity }
                        }
                    })
                }
            }
        })
        return "";
    } catch (error) {
        console.log((error as Error).message);
        return (error as Error).message;
    }
}

const getAllOrderById = async (userId: number) => {
    const orders = prisma.order.findMany({
        where: { userId: userId },
        include: {
            orderDetails: {
                include: {
                    product: true
                }
            }
        }
    })
    return orders;
}

// Hàm dựng điều kiện lọc chung (giữ nguyên rule quantity > 0 và status = 1 của bạn)
const buildProductFilterWhere = (query: any = {}) => {
    const where: any = {
        quantity: { gt: 0 },
        status: 1,
    };

    const toStringArray = (val: any): string[] => {
        if (!val) return [];
        return (Array.isArray(val) ? val : [val])
            .map((item) => String(item).trim())
            .filter(Boolean);
    };

    const toNumberArray = (val: any): number[] => {
        return toStringArray(val)
            .map(Number)
            .filter((num) => !isNaN(num));
    };

    // 1. Tìm kiếm theo từ khóa
    if (query.keyword && String(query.keyword).trim() !== "") {
        const kw = String(query.keyword).trim();
        where.OR = [
            { name: { contains: kw } },
            { cpu: { contains: kw } },
            { cpuType: { contains: kw } },
            { gpu: { contains: kw } },
        ];
    }

    // 2. Thương hiệu (brand)
    const brandIds = toNumberArray(query.brand);
    if (brandIds.length > 0) {
        where.brandId = { in: brandIds };
    }

    // 3. Nhu cầu sử dụng (category)
    const categoryIds = toNumberArray(query.category);
    if (categoryIds.length > 0) {
        where.categoryId = { in: categoryIds };
    }

    // 4. Khoảng giá (price)
    if (query.price) {
        switch (query.price) {
            case "duoi-15-trieu":
                where.priceCurr = { lt: 15000000 };
                break;
            case "15-20-trieu":
                where.priceCurr = { gte: 15000000, lte: 20000000 };
                break;
            case "20-30-trieu":
                where.priceCurr = { gte: 20000000, lte: 30000000 };
                break;
            case "tren-30-trieu":
                where.priceCurr = { gt: 30000000 };
                break;
        }
    }

    // 5. Dòng CPU (cpuType)
    const cpuTypes = toStringArray(query.cpuType);
    if (cpuTypes.length > 0) {
        where.cpuType = { in: cpuTypes };
    }

    // 6. Dung lượng RAM (ram)
    const rams = toNumberArray(query.ram);
    if (rams.length > 0) {
        where.ram = { in: rams };
    }

    // 7. Dung lượng lưu trữ (storage)
    const storages = toNumberArray(query.storage);
    if (storages.length > 0) {
        where.storage = { in: storages };
    }

    // 8. Loại GPU (gpuType)
    const gpuTypes = toStringArray(query.gpuType);
    if (gpuTypes.length > 0) {
        where.gpuType = { in: gpuTypes };
    }

    return where;
};

const countTotalProducts = async (query: any = {}) => {
    const where = buildProductFilterWhere(query);
    const totalItems = await prisma.product.count({ where });
    return totalItems;
};

const countTotalProductClientPages = async (pageSize: number, query: any = {}) => {
    const totalItems = await countTotalProducts(query);
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    return totalPages;
};

const getLimitProducts = async (page: number, pageSize: number, query: any = {}) => {
    const where = buildProductFilterWhere(query);

    let orderBy: any = { createdAt: "desc" };
    switch (query.sort) {
        case "hot":
            orderBy = [{ hot: "desc" }, { createdAt: "desc" }];
            break;
        case "best-selling":
            orderBy = [{ sold: "desc" }, { createdAt: "desc" }];
            break;
        case "price-asc":
            orderBy = { priceCurr: "asc" };
            break;
        case "price-desc":
            orderBy = { priceCurr: "desc" };
            break;
        case "newest":
        default:
            orderBy = { createdAt: "desc" };
            break;
    }

    const products = await prisma.product.findMany({
        where,
        orderBy,
        take: pageSize,
        skip: (page - 1) * pageSize,
    });
    return products;
};

export {
    getRelatedProducts,
    addProductToCart,
    getCartDetailByUserId,
    deleteProductInCart,
    updateCartDetailBeforeCheckout,
    handlePlaceOrder,
    getBestSellingProducts,
    getAllOrderById,
    getHotProducts,
    getTopDiscountedProducts,
    getProducts,
    countTotalProductClientPages,
    getLimitProducts,
    countTotalProducts
}