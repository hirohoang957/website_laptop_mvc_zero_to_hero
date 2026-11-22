import { isEmailExist } from "services/user/auth.service";
import { z } from "zod";

const emailSchema = z.string().trim().email("Email không đúng định dạng").refine(
    async (email) => {
        const existingUser = await isEmailExist(email);
        return !existingUser;
    }, {
    message: "Email already exists",
    path: ["email"],
}
);

const passwordSchema = z.string().trim()
    .min(5, { message: "Password tối thiểu phảỉ 5 ký tự" })
    .max(15, { message: "Password tối đa là 15 ký tự" });

const phoneSchema = z.string().trim()
    .regex(/^$|^[0-9]{10}$/, { message: "Số điện thoại phải bao gồm đúng 10 chữ số" })
    .optional();

export const AdminUserSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().trim(),
    phone: phoneSchema,
    fullName: z.string().trim().min(1, { message: "Họ và tên không được để trống" }),
    address: z.string().trim().optional(),
    status: z.string().optional(),
    roleId: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Password confirm khong chinh xac",
    path: ["confirmPassword"]
});

export const AdminUpdateUserSchema = z.object({
    id: z.string().optional(),
    fullName: z.string().trim().optional(),
    address: z.string().trim().optional(),
    status: z.string().optional(),
    roleId: z.string().optional(),
    phone: phoneSchema,
    email: z.string().optional(),
})

export type TAdminUserSchema = z.infer<typeof AdminUserSchema>;
export type TAdminUpdateUserSchema = z.infer<typeof AdminUpdateUserSchema>;
