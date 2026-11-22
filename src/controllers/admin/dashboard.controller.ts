import { Request, Response } from "express";
import { getAllProducts } from "services/admin/admin.product.service";
import { getAllBrands, getAllCategories, getAllOrders, getAllUsers, getCategoryById } from "services/admin/admin.service";

const getDashboardPage = async (req: Request, res: Response) => {
    return res.render("admin/dashboard/dashboard.ejs");
}

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
    return res.render("admin/order/order.ejs", {orders});
}

export {
    getDashboardPage, 
    getAdminUserPage,
    getAdminCategoryPage,
    getAdminBrandPage,
    getAdminProductPage,
    getAdminOrderPage
}