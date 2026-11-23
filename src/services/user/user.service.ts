import { getProductById } from "services/admin/admin.product.service";
import { prisma } from "config/client";
import { string } from "zod";

const getProductRecommendation = async (productsId: number[]) => {
    const products = await Promise.all(
        productsId.map((id) => getProductById(String(id)))
    );
    return products;
}

const getBestSellingProducts = async (limit: number = 8) => {
    const products = await prisma.product.findMany({
        where: {
            quantity: { gt: 0 },
            status: { gt: 0 },
        },
        orderBy: {
            sold: "desc",
        },
        take: limit,
    });
    return products;
};

const getTopDiscountProducts = async () => {
    const products = await prisma.product.findMany({
        where: {
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

const getProductHot = async (limit: number = 8) => {
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

export {
    getProductRecommendation,
    addProductToCart,
    getCartDetailByUserId,
    deleteProductInCart,
    updateCartDetailBeforeCheckout,
    handlePlaceOrder,
    getBestSellingProducts,
    getAllOrderById,
    getProductHot,
    getTopDiscountProducts
}