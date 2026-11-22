import { prisma } from "config/client";
import { Account_Type } from "config/constant";
import { hashPassword } from "services/user/auth.service";

const getAllUsers = async () => {
    const users = await prisma.user.findMany();
    return users;
}

const getAllRoles = async () => {
    const roles = await prisma.role.findMany();
    return roles;
}

const handleCreateUser = async (fullName: string, email: string, 
    password: string, address: string, phone: string, status: string, 
    avatar: string, role: string) => {
    const defaultPassword = await hashPassword(password);
    const newuser = await prisma.user.create({
        data: {
            fullName: fullName,
            username: email,
            address: address,
            password: defaultPassword,
            accountType: Account_Type.SYSTEM,
            phone: phone,
            avatar: avatar,
            roleId: +role,
            status: +status
        }
    })

    return newuser;
}

const getUserById = async (id: string) => {
    const user = await prisma.user.findUnique({
        where: { id: +id }
    });
    return user;
}

const handleUpdateUser = async (id: string, fullName: string,
    address: string, phone: string, status: string, role: string, avatar: string) => {
    const updateUser = await prisma.user.update({
        where: { id: +id },
        data: {
            fullName: fullName,
            address: address,
            phone: phone,
            status: +status,
            roleId: +role,
            ...(avatar && { avatar: avatar })
        }
    })
    return updateUser;
}

const handleDeleteUser = async (id: string) => {
    const deleteUser = await prisma.user.delete({
        where: { id: +id },
    })

    return deleteUser;
}

const getAllCategories = async () => {
    const categories = await prisma.category.findMany({
        orderBy: {
            id: 'asc', 
        },
    });
    return categories;
}

const isCategoryExist = async (name: string) => {
    const category = await prisma.category.findUnique({
        where: {name: name}
    })
    if (category) return true;
    return false;
}

const handleCreateCategory = async (name: string) => {
    const newcategory = await prisma.category.create({
        data: {
            name: name,
        }
    })
    return newcategory;
}

const handleDeleteCategory = async (id: string) => {
    const deleteCategory = await prisma.category.delete({
        where: { id: +id },
    })
    return deleteCategory;
}

const getCategoryById = async (id: string) => {
    const category = await prisma.category.findUnique({
        where: { id: +id }
    });
    return category;
}

const getAllBrands = async () => {
    const brands = await prisma.brand.findMany({
        orderBy: {
            id: 'asc', 
        },
    });
    return brands;
}

const isBrandExist = async (name: string) => {
    const brand = await prisma.brand.findUnique({
        where: {name: name}
    })
    if (brand) return true;
    return false;
}

const handleCreateBrand = async (name: string, logo: string) => {
    const newBrand = await prisma.brand.create({
        data: {
            name: name,
            logo: logo
        }
    })
    return newBrand;
}

const getBrandById = async (id: string) => {
    const brand = await prisma.brand.findUnique({
        where: { id: +id }
    });
    return brand;
}

const handleUpdateBrand = async (id: string, name: string, logo: string) => {
    const updateBrand = await prisma.brand.update({
        where: { id: +id },
        data: {
            name: name,
            ...(logo && { logo: logo })
        }
    })
    return updateBrand;
}

const handleDeleteBrand = async (id: string) => {
    const deleteBrand = await prisma.brand.delete({
        where: { id: +id }
    })
    return deleteBrand;
}

const getAllOrders = async () => {
    const orders = await prisma.order.findMany({
        include: {user : true}
    });
    return orders;
}

const getOrderDetailAdmin = async (id: number) => {
    return await prisma.orderDetail.findMany({
        where: {orderId: id},
        include: {product: true}
    })
}

export {
    getAllUsers,
    getAllRoles,
    handleCreateUser,
    getUserById,
    handleUpdateUser,
    handleDeleteUser,
    getAllCategories,
    isCategoryExist, 
    handleCreateCategory,
    handleDeleteCategory,
    getCategoryById,
    getAllBrands,
    isBrandExist,
    handleCreateBrand,
    getBrandById,
    handleUpdateBrand,
    handleDeleteBrand,
    getAllOrders,
    getOrderDetailAdmin
}