import { prisma } from "config/client";
import { Account_Type } from "config/constant";
import bcrypt from 'bcrypt';

const saltRounds = 10;

const hashPassword = async (plainText: string) => {
    return await bcrypt.hash(plainText, saltRounds);
}

const comparePassword = async (plainText: string, hashPassword: string) => {
    return await bcrypt.compare(plainText, hashPassword);
}

const isEmailExist = async (email: string) => {
    const user = await prisma.user.findUnique({
        where: {username: email}
    })

    if (user) return true;
    return false;
}

const registerNewUser = async (fullName: string, email: string, password: string) => {

    const newPassword = await hashPassword(password);

    const userRole = await prisma.role.findUnique({
        where: {name: "USER"}
    });

    if (userRole) {
        await prisma.user.create({
            data: {
                username: email, 
                password: newPassword,
                fullName: fullName,
                accountType: Account_Type.SYSTEM,
                roleId: +userRole.id,
                status: 1
            }
        });
    } else {
        throw new Error("User role khong ton tai.");
    }
}

const getUserWithRoleById = async (id: string) => {
    const user = await prisma.user.findUnique({
        where: { id: +id },
        include: {
            role: true
        },
        omit: {
            password: true,
        },
    });
    return user;
}

const getUserSumCart = async (id: string) => {
    const cart = await prisma.cart.findUnique({
        where: { userId: +id },
    });
    return cart?.sum ?? 0;
}


export {
    hashPassword,
    comparePassword,
    isEmailExist,
    registerNewUser,
    getUserWithRoleById,
    getUserSumCart
}