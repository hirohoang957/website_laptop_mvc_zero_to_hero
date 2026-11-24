import { prisma } from "config/client";
import { Account_Type } from "config/constant";
import bcrypt from 'bcrypt';

const saltRounds = 10;

// Hàm này để mã hóa mật khẩu
const hashPassword = async (plainText: string) => {
    return await bcrypt.hash(plainText, saltRounds);
}

// Hàm này để so sánh mật khẩu
const comparePassword = async (plainText: string, hashPassword: string) => {
    return await bcrypt.compare(plainText, hashPassword);
}

// Hàm này để kiểm tra email có tồn tại trong database hay không
const isEmailExist = async (email: string) => {
    const user = await prisma.user.findUnique({
        where: {username: email}
    })

    if (user) return true;
    return false;
}

// Hàm này để tạo tài khoản mới với quyền người dùng trong hệ thống
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
        throw new Error("Vai trò này không tồn tại trong hệ thống.");
    }
}

// Hàm này lấy thông tin người dùng và vai trò của người đó
const getUserWithRoleById = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: +userId },
        include: {
            role: true
        },
        omit: {
            password: true,
        },
    });
    return user;
}

// Hàm này để lấy tổng sản phẩm trong giỏ hàng
const getUserSumCart = async (userId: string) => {
    const cart = await prisma.cart.findUnique({
        where: { userId: +userId },
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