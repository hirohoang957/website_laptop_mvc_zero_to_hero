import { getProductById } from "services/admin/admin.product.service";
import { prisma } from "config/client";

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


const addProductToCart = async (quantity: number, productId: number, user: Express.User) => {
    const cart = await prisma.cart.findUnique({
        where: {userId : user.id}
    });
    const product = await prisma.product.findUnique({
        where: {id: productId}
    })


    if (cart) {
        // update sum
        await prisma.cart.update({
            where: {id: cart.id},
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
                quantity: { increment : quantity }
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
            data : {
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
        where : {userId: id}
    })

    const cartDetails = await prisma.cartDetail.findMany({
        where: {cartId: cart?.id ?? 0},
        include: {product: true}
    })


    return cartDetails
}

const deleteProductInCart = async (cartDetailId: number, userId: number, sumCart: number) => {
    await prisma.cartDetail.delete({
        where: {id: cartDetailId}
    })

    if (sumCart === 1) {
        await prisma.cart.delete({
            where: {userId: userId}
        })
    } else {
        await prisma.cart.update({
            where: {userId},
            data: {
                sum: {
                    decrement: 1,
                }
            }
        })
    }
}

const updateCartDetailBeforeCheckout = async (data: {id: string; quantity: string}[], userId: number) => {
    let sum = 0;
    data.forEach(async (item) => {
        sum += +item.quantity;
        await prisma.cartDetail.update({
            where: {id: +item.id},
            data: {quantity: +item.quantity}
        })
    })
    await prisma.cart.update({
        where: {userId: userId},
        data: {sum: sum}
    })
}

const handlePlaceOrder = async (userId: number, receiverName: string, receiverAddress: string, receiverPhone: string, totalPrice: string, paymentMethod: string) => {
    const cart = await prisma.cart.findUnique({
        where: {userId: userId},
        include: {cartDetails: true}
    })

    if (cart) {
        const dataOrderDetail = cart?.cartDetails?.map(
            item => ({
                price: item.priceCurr, 
                quantity: item.quantity, 
                productId: item.productId
            })
        ) ?? [];

        await prisma.order.create({
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

        await prisma.cartDetail.deleteMany({
            where: {cartId: cart.id}
        })

        await prisma.cart.delete({
            where: {id: cart.id}
        })
    }

    console.log(cart)
}

const getAllOrderById = async (userId: number) => {
    const orders = prisma.order.findMany({
        where: {userId: userId},
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
    getAllOrderById
}