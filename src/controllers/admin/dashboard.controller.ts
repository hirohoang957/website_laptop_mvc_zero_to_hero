import { Request, Response } from "express";
import { getAllProducts } from "services/admin/admin.product.service";
import { getAllBrands, getAllCategories, getAllOrders, getAllUsers, getCategoryById } from "services/admin/admin.service";
import { prisma } from "config/client";

const getDashboardPage = async (req: Request, res: Response) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [
        revenueAgg,
        totalOrders,
        pendingOrders,
        totalProducts,
        lowStockCount,
        totalUsers,
        recentOrders,
        lowStockProducts,
        ordersLast7Days,
        groupedStatus,
    ] = await Promise.all([
        prisma.order.aggregate({
            _sum: { totalPrice: true },
            where: {
                AND: [
                    {
                        OR: [
                            { paymentStatus: "PAID" },
                            { status: "COMPLETED" },
                        ],
                    },
                    {
                        status: { not: "CANCELLED" },
                    },
                    {
                        paymentStatus: { not: "REFUNDED" },
                    },
                ],
            },
        }),
        prisma.order.count(),
        prisma.order.count({ where: { status: "PENDING" } }),
        prisma.product.count(),
        prisma.product.count({ where: { quantity: { lte: 5 } } }),
        prisma.user.count(),
        prisma.order.findMany({
            take: 6,
            orderBy: { createdAt: "desc" },
        }),
        prisma.product.findMany({
            where: { quantity: { lte: 5 } },
            orderBy: { quantity: "asc" },
            take: 5,
        }),
        prisma.order.findMany({
            where: {
                createdAt: { gte: sevenDaysAgo },
                status: { notIn: ["CANCELLED", "REFUNDED"] },
            },
            select: { createdAt: true, totalPrice: true },
        }),
        prisma.order.groupBy({
            by: ["status"],
            _count: { status: true },
        }),
    ]);

    // Tạo mảng 7 ngày gần nhất cho biểu đồ doanh thu
    const revenueLabels: string[] = [];
    const revenueValues: number[] = [];

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
        revenueLabels.push(dayStr);

        const dayTotal = ordersLast7Days
            .filter((o) => {
                const od = new Date(o.createdAt);
                return (
                    od.getDate() === d.getDate() &&
                    od.getMonth() === d.getMonth() &&
                    od.getFullYear() === d.getFullYear()
                );
            })
            .reduce((sum, o) => sum + o.totalPrice, 0);

        revenueValues.push(dayTotal);
    }

    // Map số lượng theo từng trạng thái cho biểu đồ tròn
    const statusMap: Record<string, number> = {};
    groupedStatus.forEach((item) => {
        statusMap[item.status] = item._count.status;
    });

    const statusCounts = [
        statusMap["PENDING"] || 0,
        statusMap["PROCESSING"] || 0,
        statusMap["SHIPPING"] || 0,
        statusMap["COMPLETED"] || 0,
        statusMap["CANCELLED"] || 0,
    ];

    return res.render("admin/dashboard/dashboard.ejs", {
        stats: {
            totalRevenue: revenueAgg._sum.totalPrice || 0,
            totalOrders,
            pendingOrders,
            totalProducts,
            lowStockCount,
            totalUsers,
        },
        recentOrders,
        lowStockProducts,
        chartData: {
            revenueLabels,
            revenueValues,
            statusCounts,
        },
    });
};

const getAdminUserPage = async (req: Request, res: Response) => {
    const users = await getAllUsers();
    return res.render("admin/user/user.ejs", {
        users: users
    });
}

const getAdminCategoryPage = async (req: Request, res: Response) => {
    const categories = await getAllCategories();
    return res.render("admin/category/category.ejs", {
        categories: categories
    });
}

const getAdminBrandPage = async (req: Request, res: Response) => {
    const brands = await getAllBrands();
    return res.render("admin/brand/brand.ejs", {
        brands: brands
    });
}

const getAdminProductPage = async (req: Request, res: Response) => {
    const products = await getAllProducts();
    const brands = await getAllBrands();
    const categories = await getAllCategories();
    return res.render("admin/product/product.ejs", {
        brands: brands,
        categories: categories,
        products: products
    });
}

const getAdminOrderPage = async (req: Request, res: Response) => {
    const orders = await getAllOrders();
    return res.render("admin/order/order.ejs", { orders });
}

export {
    getDashboardPage,
    getAdminUserPage,
    getAdminCategoryPage,
    getAdminBrandPage,
    getAdminProductPage,
    getAdminOrderPage
}